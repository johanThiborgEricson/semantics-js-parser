function CodePointer(code) {
  var that = Object.create(CodePointer.prototype);
  that._code = code;
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
  if(!match || match.index !== 0) {
    this.reportParseError(token);
    return null;
  }
  
  this._pointer += match[0].length;
  return match.slice(1);
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
  

