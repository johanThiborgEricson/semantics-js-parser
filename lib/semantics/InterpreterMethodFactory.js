InterpreterMethodFactory = function() {
  "use strict";
  var that = Object.create(InterpreterMethodFactory.prototype);
  
  that.CodePointer = CodePointer;
  
  return that;
};

InterpreterMethodFactory.prototype
.makeMethod = function(instructionMaker) {
  "use strict";
  var methodFactory = this;
  var method = function(code, debugging) {
    var codePointer;
    var isInternalCall = false;
    var name = methodFactory.nameOf(this, method);
    var backup;
    var maybeInstruction;
    var result;
    
    if(code instanceof CodePointer) {
      codePointer = code;
      isInternalCall = true;
    } else {
      codePointer = methodFactory.CodePointer(code, debugging);
    }
    
    codePointer.logParseStart(name);
    backup = codePointer.backup();
    maybeInstruction = instructionMaker(codePointer, this);
    if(!maybeInstruction){
      codePointer.restore(backup);
    }
    codePointer.logParseEnd(name, !!maybeInstruction);
    
    if(isInternalCall) {
      result = maybeInstruction;
    } else { // isExternalCall
      if(!maybeInstruction) {
        throw new Error(codePointer.getParseErrorDescription());
      } else if(codePointer.getUnparsed() !== "") {
        throw new Error("Trailing code: '" + codePointer.getUnparsed() + "'.");
      } else {
        result = maybeInstruction(this);
      }
      
    }
    
    return result;
    
  };
  
  return method;
};

InterpreterMethodFactory.prototype
.nameOf = function(o, propertyValue) {
  for(var propertyName in o) {
    if(o[propertyName] === propertyValue) {
      return propertyName;
    }
  }
};

InterpreterMethodFactory.prototype
.terminal = function(token, interpretation){
  "use strict";
  var instructionMaker = function(codePointer, interpreter) {
    var lexeme = codePointer.parse(token);
    if(!lexeme) {
      return null;
    }
    
    var instruction = function(interpreter) {
      return interpretation.apply(interpreter, lexeme);
    };
    
    return instruction;
  };
  
  return this.makeMethod(instructionMaker);
};

InterpreterMethodFactory.prototype
.terminalEmptyString = function(interpretation){
  "use strict";
  return this.terminal(/(?:)/, interpretation);
};

InterpreterMethodFactory.prototype
.terminalSkip = function(terminal) {
  return this.terminal(terminal, function(){});
};

InterpreterMethodFactory.prototype
.nonTerminalSequence = function() {
  "use strict";
  var names;
  var interpretation;

  if(typeof arguments[arguments.length - 1] === "string") {
    names = Array.prototype.slice.call(arguments);
  } else {
    interpretation = arguments[arguments.length - 1];
    names = Array.prototype.slice.call(arguments, 0, -1);
  }
  
  var instructionMaker = function(codePointer, interpreter) {
    var instructions = [];
    var stringNames = [];
    for(var i = 0; i < names.length; i++) {
      var name = names[i];
      if(name instanceof RegExp) {
        var parsingIsSuccessful = codePointer.parse(name);
        if(!parsingIsSuccessful) {
          return null;
        }
      } else { // name instanceof String
        stringNames.push(name);
        var maybeInstruction = interpreter[name](codePointer);
        if(!maybeInstruction) {
          return null;
        }
        
        instructions.push(maybeInstruction);
      }
      
    }

    var instruction = function(interpreter) {
      var resultsArray = [];
      var resultsObject = {};
      for(var i = 0; i < stringNames.length; i++) {
        var name = stringNames[i];
        var result = instructions[i](interpreter);
        resultsArray.push(result);
        resultsObject[name] = result;
      }
      
      if(interpretation) {
        return interpretation.apply(interpreter, resultsArray);
      } else {
        return resultsObject;
      }
    };
    
    return instruction;
  };
  
  return this.makeMethod(instructionMaker);
};

InterpreterMethodFactory.prototype
.nonTerminalAlternative = function() {
  "use strict";
  var alternatives = Array.prototype.slice.call(arguments);
  var instructionMaker = function(codePointer, interpreter) {
    var parseSuccess = false;
    var i = 0;
    while(!parseSuccess && i < alternatives.length) {
      parseSuccess = interpreter[alternatives[i++]](codePointer);
    }
    
    return parseSuccess;
  };
  
  return this.makeMethod(instructionMaker);
};

InterpreterMethodFactory.prototype
.nonTerminalAsterisk = function(name, interpretation) {
  "use strict";
  var instructionMaker = function(codePointer, interpreter) {
    var maybeInstruction = true;
    var instructions = [];
    while(maybeInstruction) {
      maybeInstruction = interpreter[name](codePointer);
      instructions.push(maybeInstruction);
    }
    
    instructions.pop();
    
    var instruction = function(interpreter) {
      var results = instructions.map(function(subInstruction) {
        return subInstruction(interpreter);
      });
      
      if(interpretation) {
        return interpretation.call(interpreter, results);
      } else {
        return results;
      }
    };
    
    return instruction;
  };
  
  return this.makeMethod(instructionMaker);
};

InterpreterMethodFactory.prototype
.nonTerminalQuestionMark = function(name, defaultReturnValue) {
  var instructionMaker = function(codePointer, interpreter) {
    var maybeInstruction = interpreter[name](codePointer);
    var instruction = function(interpreter) {
      var result;
      if(maybeInstruction) {
        result = maybeInstruction(interpreter);
      } else {
        result = defaultReturnValue;
      }
      
      return result;
    };
    
    return instruction;
  };
  
  return this.makeMethod(instructionMaker);
};

InterpreterMethodFactory.prototype
.deferredExecution = function(name) {
  var instructionMaker = function(codePointer, interpreter) {
    var instructionToDeferre = interpreter[name](codePointer);
    var instruction = function(interpreter) {
      return instructionToDeferre;
    };
    
    return instruction;
  };
  
  return this.makeMethod(instructionMaker);
};
