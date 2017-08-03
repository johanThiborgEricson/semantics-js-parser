describe("A variable statement", function() {
  it("can define one variable", function() {
    var global = {};
    var js = new JavaScriptParser(global);
    
    js.variableStatement("var a=1;");
    
    expect(global.a).toBe(1);
  });
  
  it("doesn't need to be initialized", function() {
    var global = {};
    var js = new JavaScriptParser(global);
    
    expect(function() {
      js.variableStatement("var a;");
    }).not.toThrow();
    
  });
  
});
