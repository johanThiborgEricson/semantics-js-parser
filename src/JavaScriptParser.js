function JavaScriptParser() {
  this.global = {};
}

(function() {
  var f = new InterpreterMethodFactory();
  var j = {};
  JavaScriptParser.prototype = j;
  
  j.statements = f.nonTerminalAsterisk("statement", function(statements) {
    
  });
  
  j.programInit = f.terminalEmptyString(function() {
    this.executionContext = this.global;
    this.outerContext = new Map();
    this.outerContext.set(this.executionContext, null);
  });
  
  j.program = f.nonTerminalSequence("programInit", "statements", 
  function(programInit, statements) {
    
  });
  
  j.statement = f.nonTerminalAlternative(
    "variableStatement", "expressionStatement");
    
  j.expressionStatement = f.nonTerminalSequence("assignmentExpression", /;/, 
  function() {});
  
  j.variableStatement = f.nonTerminalSequence(/var /, "identifier", 
  "initialiserOpt", /;/, 
  function(identifier, initialiser) {
    this.executionContext[identifier] = initialiser;
  });
  
  j.identifier = f.terminal(/([a-z])/, function(match) {
    return match;
  });
  
  j.numericLiteral = f.terminal(/([0-9])/, function(match) {
    return Number(match);
  });
  
  j.initialiser = f.nonTerminalSequence(/=/, "assignmentExpression", 
  function(assignmentExpression) {
    return assignmentExpression;
  });
  
  j.assignmentExpression = f.nonTerminalAlternative("numericLiteral", 
  "functionExpression", "callExpression", "assignmentExpression1");
  
  j.callExpression = f.nonTerminalSequence("identifier", /\(/, /\)/, 
  function(identifier) {
    this.executionContext[identifier](this);
  });
  
  j.assignmentExpression1 = f.nonTerminalSequence("identifier", /=/, 
  "assignmentExpression", function(identifier, assignmentExpression) {
    this.executionContext[identifier] = assignmentExpression;
    return assignmentExpression;
  });
  
  j.functionExpression = f.nonTerminalSequence(/function/, 
  /\(/, /\)/, /\{/, "functionBody", /\}/, function(functionBody) {
    return functionBody;
  });
  
  j.functionBody = f.deferredExecution("program");
  
  j.initialiserOpt = f.nonTerminalQuestionMark("initialiser", undefined);
  
})();
