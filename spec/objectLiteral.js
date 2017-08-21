describe("An object literal", function() {
  
  var j = new JavaScriptParser();
  
  it("may be empty", function() {
    j.program("var a={};");
    
    expect(j.global.a).toEqual({});
  });
  
  it("can contain one property", function() {
    j.program("var a={b:1};");
    
    expect(j.global.a).toEqual({b:1});
  });
  
  it("can contain many properties", function() {
    j.program("var a={b:1,c:2,d:3};");
    
    expect(j.global.a).toEqual({b:1,c:2,d:3});
  });
  
  it("accepts a trailing comma", function() {
    j.program("var a={b:1,};");
    
    expect(j.global.a).toEqual({b:1});
  });
  
  it("can be nested", function() {
    j.program("var a={b:{c:{}}};");
    
    expect(j.global.a).toEqual({b:{c:{}}});
  });
  
});
