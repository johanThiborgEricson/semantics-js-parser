describe("A function expression", function() {
  
  var js = new JavaScriptParser();
    
  it("returns a function", function() {
    js.program("var f=function(){};");
    
    expect(js.global.f).toEqual(jasmine.any(Function));
  });
  
  it("can be called", function() {
    js.program("var a;var f=function(){a=1;};f();");
    
    expect(js.global.a).toBe(1);
  });
  
  it("creates a execution context", function() {
    js.program("var a=0;var f=function(){var a=1;};f();");
    
    expect(js.global.a).toBe(0);
  });
  
  it("can return a value", function() {
    js.program("var f=function(){return 1;};var a=f();");
    
    expect(js.global.a).toBe(1);
  });
  
});
