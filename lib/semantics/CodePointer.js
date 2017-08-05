function CodePointer(code, debugging) {
  var that = Object.create(CodePointer.prototype);
  that._code = code;
  that._debugging = debugging;
  that._pointer = 0;
  that.parseErrorDescription = {
    actuallCode: {
      length: Infinity,
    }
  };
  
  return that;
}

CodePointer.prototype
.parse = function(token) {
  var unparsedCode = this._code.slice(this._pointer);
  var match = token.exec(unparsedCode);
  if(this._debugging) {
    var remainingLine = /[^\n]*/.exec(unparsedCode)[0];
    console.log("%s.exec(\"%s\")", token.toString(), remainingLine);
  }
  
  if(!match || match.index !== 0) {
    if(this._debugging) {
      console.log("Match failed");
    }
    this.reportParseError(token);
    return null;
  } else if(this._debugging) {
    console.log("Matched \"%s\"", match[0]);
  }
  
  this._pointer += match[0].length;
  return match.slice(1);
};

CodePointer.prototype
.logParseStart = function(name) {
  if(this._debugging) {
    console.log("<%s>", name);
  }
};

CodePointer.prototype
.logParseEnd = function(name, parseSuccess) {
  var message 
  = parseSuccess ? "Successfully parsed %s." : "Failed to parse %s.";
  if(this._debugging) {
    console.log(message, name);
    console.log("</%s>", name);
  }
  
};

CodePointer.prototype
.backup = function() {
  return this._pointer;
};

CodePointer.prototype
.restore = function(backup) {
  this._pointer = backup;
};

CodePointer.prototype
.getUnparsed = function() {
  return this._code.slice(this._pointer);
};

CodePointer.prototype
.reportParseError = function(token) {
  var stripedToken = token.toString().slice(1, -1);
  var tokenAlternatives = stripedToken;
  var currentUnparsed = this.getUnparsed();
  var currentLength = currentUnparsed.length;
  var previousLength = this.parseErrorDescription.actuallCode.length;
  
  if(currentLength > previousLength) {
    return;
  }
  
  if(currentLength < previousLength) {
    this.parseErrorDescription.expectedAlternatives = undefined;
  }
  
  if(this.parseErrorDescription.expectedAlternatives) {
    tokenAlternatives = 
    this.parseErrorDescription.expectedAlternatives + "|" + stripedToken;
  }
  
  this.parseErrorDescription = {
    expectedAlternatives: tokenAlternatives,
    actuallCode: currentUnparsed,
  };

};

CodePointer.prototype
.getParseErrorDescription = function() {
  return "Expected /^" + this.parseErrorDescription.expectedAlternatives + 
  "/ to match '" + this.parseErrorDescription.actuallCode + "'.";
};
