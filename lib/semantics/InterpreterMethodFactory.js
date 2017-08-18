InterpreterMethodFactory = function() {
  "use strict";
  var that = Object.create(InterpreterMethodFactory.prototype);
  
  that.CodePointer = CodePointer;
  
  return that;
};

InterpreterMethodFactory
.callInterpreterMethod = function(interpreter, methodName, codePointer) {
  return interpreter[methodName](codePointer, methodName);
};

InterpreterMethodFactory.preInstructionMaker = 
function(interpreter, methodFactory, method, code, debuggingOrMethodName) {
  var v = {};

  if(code instanceof CodePointer) {
    v.isInternalCall = true;
    v.codePointer = code;
    v.name = debuggingOrMethodName;
  } else {
    v.isInternalCall = false;
    v.codePointer = methodFactory.CodePointer(code, debuggingOrMethodName);
    v.name = methodFactory.nameOf(interpreter, method);
  }
  
  v.codePointer.logParseStart(v.name);
  v.backup = v.codePointer.backup();
  
  return v;
};

InterpreterMethodFactory.postInstructionMaker = 
function(v, interpreter, maybeInstruction) {
  var result;
  if(!maybeInstruction){
    v.codePointer.restore(v.backup);
  }
  
  v.codePointer.logParseEnd(v.name, !!maybeInstruction);
  if(v.isInternalCall) {
    result = maybeInstruction;
  } else { // isExternalCall
    if(!maybeInstruction) {
      throw new Error(v.codePointer.getParseErrorDescription());
    } else if(v.codePointer.getUnparsed() !== "") {
      throw new Error("Trailing code: '" + v.codePointer.getUnparsed() + "'.");
    } else {
      result = maybeInstruction(interpreter);
    }
    
  }
  
  return result;
  
};

InterpreterMethodFactory.prototype
.makeMethod = function(instructionMaker) {
  "use strict";
  var methodFactory = this;
  var method = function(code, debuggingOrMethodName) {
    var v = InterpreterMethodFactory.preInstructionMaker(this, methodFactory, 
    method, code, debuggingOrMethodName);
    var maybeInstruction = instructionMaker(v.codePointer, this, v.name);
    return InterpreterMethodFactory.
        postInstructionMaker(v, this, maybeInstruction);
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

  if(arguments[arguments.length - 1] instanceof Function) {
    interpretation = arguments[arguments.length - 1];
    names = Array.prototype.slice.call(arguments, 0, -1);
  } else {
    names = Array.prototype.slice.call(arguments);
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
        var maybeInstruction = InterpreterMethodFactory
            .callInterpreterMethod(interpreter, name, codePointer);
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
  var instructionMaker = function(codePointer, interpreter, methodName) {
    var parseSuccess = false;
    var i = 0;
    while(!parseSuccess && i < alternatives.length) {
      parseSuccess = InterpreterMethodFactory
          .callInterpreterMethod(interpreter, alternatives[i++], codePointer);
    }
    
    return parseSuccess;
  };
  
  return this.makeMethod(instructionMaker);
};

InterpreterMethodFactory.prototype
.disjunction = function() {
  if(arguments.length === 0) {
    throw new Error("A disjunction needs at least one alternative.");
  }
  
  var alternativesNames = arguments;
  
  var instructionMaker = function(codePointer, interpreter, methodName) {
    var cp = codePointer;
    var p = cp._pointer;
    var heads = cp.heads[p] = cp.heads[p] || {};
    var maybeInstruction = null;
    var i;
    var cache = null;
    var head = {};
    if(heads[methodName]) {
      cp._pointer = heads[methodName].end;
      return heads[methodName].cache;
    } else {
      heads[methodName] = head;
    }
    
    maybeInstruction = null;
    i = 0;
    while(!maybeInstruction && i < alternativesNames.length) {
      maybeInstruction = InterpreterMethodFactory
      .callInterpreterMethod(interpreter, alternativesNames[i++], codePointer);
    }
    
    if(!maybeInstruction) {
      return null;
    }
    var hasProgressed = true;

    while(hasProgressed) {
      head.cache = maybeInstruction;
      head.end = cp._pointer;
      
      cp._pointer = p;
      maybeInstruction = null;
      i = 0;
      while(!maybeInstruction && i < alternativesNames.length) {
        maybeInstruction = InterpreterMethodFactory
        .callInterpreterMethod(interpreter, alternativesNames[i++], codePointer);
      }
      
      hasProgressed = cp._pointer > head.end;
      
      if(!maybeInstruction || !hasProgressed) {
        cp._pointer = head.end;
        maybeInstruction = head.cache;
      }
        
    }
    
    return maybeInstruction;
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
      maybeInstruction = InterpreterMethodFactory
          .callInterpreterMethod(interpreter, name, codePointer);
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
    var maybeInstruction = InterpreterMethodFactory
    .callInterpreterMethod(interpreter, name, codePointer);
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
    var instructionToDeferre = InterpreterMethodFactory
    .callInterpreterMethod(interpreter, name, codePointer);
    var instruction = function(interpreter) {
      return instructionToDeferre;
    };
    
    return instruction;
  };
  
  return this.makeMethod(instructionMaker);
};
