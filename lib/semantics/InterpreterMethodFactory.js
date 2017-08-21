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
.atom = function(regExp, interpretation) {
  "use strict";
  var instructionMaker = function(codePointer, interpreter) {
    var match = codePointer.matchAtPointer(regExp);
    if(match === null) {
      return null;
    }
    
    var l = match.length;
    var result = l<=2?match[l-1]:Array.prototype.slice.call(match, 1);
    var interpretationArguments = Array.prototype.slice.call(match);
    var fullMatch = interpretationArguments.shift(1);
    interpretationArguments.push(fullMatch);
    
    var instruction = function(interpreter) {
      if(interpretation) {
        result = interpretation.apply(interpreter, interpretationArguments);
      }
      
      return result;
    };
    
    return instruction;
  };
  
  return this.makeMethod(instructionMaker);
};

InterpreterMethodFactory.prototype
.empty = function(interpretation) {
  "use strict";
  if(!interpretation) {
    throw new Error("The empty string atom should be called with a function");
  }
  
  var instructionMaker = function(codePointer, interpreter) {
    var instruction = function(interpreter) {
      return interpretation.call(interpreter);
    };
    
    return instruction;
  };
  
  return this.makeMethod(instructionMaker);
};

InterpreterMethodFactory.prototype
.group = function() {
  "use strict";
  var partNames;
  var interpretation = arguments[arguments.length-1];
  if(interpretation instanceof Function) {
    partNames = Array.prototype.slice.call(arguments, 0, -1);
  } else {
    interpretation = null;
    partNames = Array.prototype.slice.call(arguments);
  }
  var instructionMaker = function(codePointer, interpreter) {
    var partInstructions = [];

    for(var i = 0; i < partNames.length; i++) {
      var partName = partNames[i];
      if(typeof partName === "string") {
        var maybeInstruction = InterpreterMethodFactory
          .callInterpreterMethod(interpreter, partName, codePointer);
        if(!maybeInstruction){
          return null;
        }
        maybeInstruction.partName = partName;
        partInstructions.push(maybeInstruction);
      } else if(partName instanceof RegExp) {
        if(!codePointer.matchAtPointer(partName)) {
          return null;
        }
      }
      
    }
    
    var instruction = function(interpreter) {
      var result = {};
      var interpretationArguments = [];
      var nameCount = Object.create(null);
      partInstructions.map(function(partInstruction) {
        var partResult = partInstruction(interpreter);
        interpretationArguments.push(partResult);
        var name = partInstruction.partName;
        if(nameCount[name] === undefined) {
          nameCount[name] = 0;
        }
        
        if(nameCount[name] === 0) {
          result[name] = partResult;
        } else if(nameCount[name] === 1) {
          result[name] = [result[name], partResult];
        } else {
          result[name].push(partResult);
        }
        
        nameCount[name]++;
      });
      
      if(interpretation) {
        result = interpretation.apply(interpreter, interpretationArguments);
      }
      
      return result;
    };
    
    return instruction;
  };
  
  return this.makeMethod(instructionMaker);
};

InterpreterMethodFactory.prototype.or = function() {
  if(arguments.length === 0) {
    throw new Error("An or needs at least one alternative.");
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
.star = function(partName, interpretation) {
  "use strict";
  var instructionMaker = function(codePointer, interpreter) {
    var partInstructions = [];
    var maybeInstruction = InterpreterMethodFactory
    .callInterpreterMethod(interpreter, partName, codePointer);
    while(maybeInstruction) {
      partInstructions.push(maybeInstruction);
      maybeInstruction = InterpreterMethodFactory
      .callInterpreterMethod(interpreter, partName, codePointer);
    }
    
    var instruction = function(interpreter) {
      var results = partInstructions.map(function(partInstruction) {
        return partInstruction(interpreter);
      });
      
      if(interpretation) {
        results = interpretation.call(interpreter, results);
      }
      
      return results;
    };
    
    return instruction;
  };
  
  return this.makeMethod(instructionMaker);
};

InterpreterMethodFactory.prototype
.opt = function(name, defaultReturnValue) {
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
