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
  
});
