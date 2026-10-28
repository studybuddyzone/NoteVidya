
    const progData = [
        // --- C PROGRAMMING (1-50) ---
        {c:"C", q:"Who invented C?", a:"Dennis Ritchie", b:"Bjarne", c:"Guido", d:"James", ans:"a"},
        {c:"C", q:"Which is a valid keyword in C?", a:"switch", b:"then", c:"public", d:"package", ans:"a"},
        {c:"C", q:"Size of char in C?", a:"1 byte", b:"2 bytes", c:"4 bytes", d:"8 bytes", ans:"a"},
        {c:"C", q:"Operator used for dereferencing?", a:"&", b:"*", c:"->", d:".", ans:"b"},
        {c:"C", q:"Return type of malloc()?", a:"int*", b:"void*", c:"char*", d:"float*", ans:"b"},
        {c:"C", q:"Which loop is exit-controlled?", a:"for", b:"while", c:"do-while", d:"if", ans:"c"},
        {c:"C", q:"Header for exit() function?", a:"stdio.h", b:"stdlib.h", c:"conio.h", d:"ctype.h", ans:"b"},
        {c:"C", q:"Format specifier for string?", a:"%s", b:"%c", d:"%d", c:"%f", ans:"a"},
        {c:"C", q:"Can we use 'break' inside 'if'?", a:"Yes", b:"No", c:"Only if in loop", d:"None", ans:"c"},
        {c:"C", q:"Default value of static variable?", a:"Garbage", b:"0", c:"1", d:"Null", ans:"b"},
        {c:"C", q:"Function to read a line from console?", a:"scanf", b:"gets", c:"printf", d:"puts", ans:"b"},
        {c:"C", q:"Operator with highest precedence?", a:"+", b:"*", c:"()", d:"=", ans:"c"},
        {c:"C", q:"An array name is a?", a:"Pointer", b:"Constant pointer", c:"Value", d:"String", ans:"b"},
        {c:"C", q:"Extension of C source file?", a:".cpp", b:".c", c:".h", d:".obj", ans:"b"},
        {c:"C", q:"Type of C language?", a:"Object Oriented", b:"Structural/Procedural", c:"Scripting", d:"Markup", ans:"b"},
        {c:"C", q:"Which is not a logical operator?", a:"&&", b:"||", c:"!", d:"|", ans:"d"},
        {c:"C", q:"Structure members are accessed by?", a:".", b:"->", c:"Both a&b", d:"None", ans:"c"},
        {c:"C", q:"Sizeof is a?", a:"Function", b:"Operator", c:"Keyword", d:"Macro", ans:"b"},
        {c:"C", q:"Variable defined outside all functions?", a:"Local", b:"Global", c:"Static", d:"Register", ans:"b"},
        {c:"C", q:"Which is used for multi-line comment?", a:"//", b:"/* */", c:"#", d:"--", ans:"b"},
        {c:"C", q:"File opening mode for writing at end?", a:"w", b:"a", c:"r", d:"x", ans:"b"},
        {c:"C", q:"Index of 5th element in array?", a:"5", b:"4", c:"6", d:"0", ans:"b"},
        {c:"C", q:"Minimum number of times do-while runs?", a:"0", b:"1", c:"2", d:"infinite", ans:"b"},
        {c:"C", q:"Which is used to avoid multiple header inclusion?", a:"Header guard", b:"Namespace", c:"Class", d:"Main", ans:"a"},
        {c:"C", q:"scanf is used for?", a:"Input", b:"Output", c:"Loop", d:"Storage", ans:"a"},
        {c:"C", q:"Enum is a ___ data type?", a:"Primitive", b:"User-defined", c:"Pointer", d:"Derived", ans:"b"},
        {c:"C", q:"Value of 10 % 3?", a:"3", b:"1", c:"0", d:"10", ans:"b"},
        {c:"C", q:"String ends with?", a:"\\0", b:"\\n", c:"\\t", d:".", ans:"a"},
        {c:"C", q:"Recursion uses which data structure?", a:"Queue", b:"Stack", c:"Tree", d:"Linked List", ans:"b"},
        {c:"C", q:"Which keyword is used for constants?", a:"const", b:"define", c:"fixed", d:"final", ans:"a"},
        {c:"C", q:"A pointer to a pointer is?", a:"Illegal", b:"Allowed", c:"Only for int", d:"None", ans:"b"},
        {c:"C", q:"Library for mathematical functions?", a:"math.h", b:"stdio.h", c:"string.h", d:"stdlib.h", ans:"a"},
        {c:"C", q:"Result of 5 / 2 in C (int)?", a:"2.5", b:"2", c:"3", d:"0", ans:"b"},
        {c:"C", q:"Which of these is not a storage class?", a:"auto", b:"extern", c:"volatile", d:"static", ans:"c"},
        {c:"C", q:"Union size is determined by?", a:"Sum of all", b:"Largest member", c:"Smallest member", d:"Fixed 100 bytes", ans:"b"},
        {c:"C", q:"'auto' variables are stored in?", a:"Heap", b:"Stack", c:"Register", d:"Disk", ans:"b"},
        {c:"C", q:"C preprocessor begins with?", a:"@", b:"#", c:"$", d:"%", ans:"b"},
        {c:"C", q:"Function name in C must be unique?", a:"Yes", b:"No", c:"Depends", d:"Only for main", ans:"a"},
        {c:"C", q:"'continue' is used for?", a:"Exit loop", b:"Next iteration", c:"Stop program", d:"Restart function", ans:"b"},
        {c:"C", q:"Typedef creates a?", a:"New variable", b:"Alias for type", c:"Macro", d:"Constant", ans:"b"},
        {c:"C", q:"Which is a bitwise operator?", a:"&", b:"&&", c:"==", d:"||", ans:"a"},
        {c:"C", q:"Size of float?", a:"2", b:"4", c:"8", d:"1", ans:"b"},
        {c:"C", q:"Function to free memory?", a:"delete", b:"free()", c:"remove", d:"drop", ans:"b"},
        {c:"C", q:"Shortest C program is?", a:"main(){}", b:"int main(){}", c:"#include", d:"void", ans:"a"},
        {c:"C", q:"Is C case sensitive?", a:"Yes", b:"No", c:"Only for strings", d:"None", ans:"a"},
        {c:"C", q:"'goto' uses which concept?", a:"Labels", b:"Functions", c:"Classes", d:"Pointers", ans:"a"},
        {c:"C", q:"'void' means?", a:"Zero", b:"Empty/No type", c:"Error", d:"Infinity", ans:"b"},
        {c:"C", q:"Command line arguments are stored in?", a:"argc, argv", b:"main, exit", c:"input, output", d:"None", ans:"a"},
        {c:"C", q:"Standard C library?", a:"ANSI C", b:"K&R C", c:"C11", d:"libc", ans:"d"},
        {c:"C", q:"Can a structure contain itself?", a:"Yes", b:"No", c:"Via pointer", d:"None", ans:"c"},

        // --- C++ PROGRAMMING (51-100) ---
        {c:"C++", q:"Which is the 'insertion' operator?", a:"<<", b:">>", c:"::", d:".", ans:"a"},
        {c:"C++", q:"Default access specifier in class?", a:"public", b:"private", c:"protected", d:"internal", ans:"b"},
        {c:"C++", q:"Support for OOPs makes C++ a?", a:"Low level", b:"Middle level", c:"High level", d:"None", ans:"b"},
        {c:"C++", q:"Operator used for Scope Resolution?", a:".", b:"::", c:"->", d:"?", ans:"b"},
        {c:"C++", q:"Function overloading is?", a:"Compile-time", b:"Runtime", c:"Ad-hoc", d:"None", ans:"a"},
        {c:"C++", q:"Keyword used to create a class?", a:"Class", b:"class", c:"STRUCT", d:"object", ans:"b"},
        {c:"C++", q:"Destructor name starts with?", a:"#", b:"~", c:"!", d:"@", ans:"b"},
        {c:"C++", q:"Virtual function is used for?", a:"Compile time", b:"Runtime polymorphism", c:"Sorting", d:"Error", ans:"b"},
        {c:"C++", q:"Which is not a pillar of OOP?", a:"Inheritance", b:"Encapsulation", c:"Abstraction", d:"Pointers", ans: "d"},
        {c:"C++", q:"Constructor that takes no arguments?", a:"Parameterized", b:"Default", c:"Copy", d:"Friend", ans:"b"},
        {c:"C++", q:"'new' operator is for?", a:"Static memory", b:"Dynamic memory", c:"Deleting", d:"None", ans:"b"},
        {c:"C++", q:"Which cannot be inherited?", a:"Public", b:"Private", c:"Protected", d:"Methods", ans:"b"},
        {c:"C++", q:"The 'this' pointer refers to?", a:"Base class", b:"Current object", c:"Static data", d:"Null", ans:"b"},
        {c:"C++", q:"Friend function can access?", a:"Private members", b:"Public members", c:"Both", d:"Only protected", ans:"c"},
        {c:"C++", q:"Abstract class must have?", a:"Constructor", b:"Pure virtual function", c:"Static data", d:"Main", ans:"b"},
        {c:"C++", q:"C++ header for input/output?", a:"stdio.h", b:"iostream", c:"conio.h", d:"math.h", ans:"b"},
        {c:"C++", q:"Keyword for inheritance?", a:"extends", b:":", c:"inherit", d:"implements", ans:"b"},
        {c:"C++", q:"'template' is used for?", a:"Classes", b:"Functions", c:"Generic programming", d:"None", ans:"c"},
        {c:"C++", q:"'inline' keyword suggests?", a:"Macro", b:"Function expansion at call", c:"Recursion", d:"Error", ans:"b"},
        {c:"C++", q:"Which operator can't be overloaded?", a:"+", b:"-", c:"::", d:"*", ans:"c"},
        {c:"C++", q:"Standard namespace in C++?", a:"std", b:"sys", c:"out", d:"main", ans:"a"},
        {c:"C++", q:"What is an object?", a:"Template", b:"Instance of class", c:"Variable", d:"Function", ans:"b"},
        {c:"C++", q:"Can we have multiple constructors?", a:"Yes", b:"No", c:"Only two", d:"Depends", ans:"a"},
        {c:"C++", q:"Data hiding is achieved via?", a:"Encapsulation", b:"Inheritance", c:"Polymorphism", d:"Classes", ans:"a"},
        {c:"C++", q:"'protected' members are accessible to?", a:"Anyone", b:"Derived classes", c:"Only self", d:"None", ans:"b"},
        {c:"C++", q:"Member function defined inside class is by default?", a:"Virtual", b:"Inline", c:"Static", d:"Friend", ans:"b"},
        {c:"C++", q:"STL stands for?", a:"Standard Template Library", b:"Static Tool Link", c:"Simple Type List", d:"None", ans:"a"},
        {c:"C++", q:"Which is used for exception handling?", a:"if-else", b:"try-catch", c:"do-while", d:"switch", ans:"b"},
        {c:"C++", q:"Base class for all I/O classes?", a:"ios", b:"iostream", c:"fstream", d:"ostream", ans:"a"},
        {c:"C++", q:"What is 'cout'?", a:"Keyword", b:"Function", c:"Object", d:"Operator", ans:"c"},
        {c:"C++", q:"Which keyword is for constant objects?", a:"const", b:"static", c:"volatile", d:"final", ans:"a"},
        {c:"C++", q:"Dynamic binding happens at?", a:"Compile time", b:"Runtime", c:"Link time", d:"None", ans:"b"},
        {c:"C++", q:"Can a class have multiple destructors?", a:"Yes", b:"No", c:"Depends", d:"None", ans:"b"},
        {c:"C++", q:"Multiple inheritance is?", a:"Supported", b:"Not supported", c:"Only for interfaces", d:"None", ans:"a"},
        {c:"C++", q:"Copy constructor takes argument as?", a:"Value", b:"Reference", c:"Pointer", d:"None", ans:"b"},
        {c:"C++", q:"Operator for deleting dynamic memory?", a:"free", b:"delete", c:"remove", d:"drop", ans:"b"},
        {c:"C++", q:"Which is not a C++ keyword?", a:"virtual", b:"friend", c:"extends", d:"mutable", ans:"c"},
        {c:"C++", q:"Output of 5 == 5 in C++?", a:"True", b:"1", c:"0", d:"Error", ans:"b"},
        {c:"C++", q:"C++ was initially named as?", a:"C with Classes", b:"D", c:"C plus", d:"New C", ans:"a"},
        {c:"C++", q:"Static members are shared by?", a:"No one", b:"All objects of class", c:"Only main", d:"None", ans:"b"},
        {c:"C++", q:"'throw' is used for?", a:"Printing", b:"Exceptions", c:"Loops", d:"Exiting", ans:"b"},
        {c:"C++", q:"Overloading the ++ operator?", a:"Prefix/Postfix", b:"Unary only", c:"Binary only", d:"None", ans:"a"},
        {c:"C++", q:"File stream for reading?", a:"ofstream", b:"ifstream", c:"fstream", d:"iostream", ans:"b"},
        {c:"C++", q:"Pure virtual function is assigned to?", a:"0", b:"1", c:"Null", d:"None", ans:"a"},
        {c:"C++", q:"A class containing pure virtual function is?", a:"Concrete", b:"Abstract", c:"Static", d:"None", ans:"b"},
        {c:"C++", q:"Can we overload main()?", a:"Yes", b:"No", c:"Depends", d:"Only in C", ans:"b"},
        {c:"C++", q:"Which is used for cin?", a:"Extraction >>", b:"Insertion <<", c:"Dot .", d:"Scope ::", ans:"a"},
        {c:"C++", q:"Pointer to a class member?", a:".*", b:"::", c:"->*", d:"Both a&c", ans:"d"},
        {c:"C++", q:"Is C++ a pure Object Oriented language?", a:"Yes", b:"No (Hybrid)", c:"Depends", d:"None", ans:"b"},
        {c:"C++", q:"C++ supports ___ inheritance.", a:"Single", b:"Multiple", c:"Multilevel", d:"All of these", ans:"d"},

        // --- PYTHON PROGRAMMING (101-150) ---
        {c:"Python", q:"Python is an ____ language?", a:"Compiled", b:"Interpreted", c:"Machine", d:"None", ans:"b"},
        {c:"Python", q:"Who created Python?", a:"Guido van Rossum", b:"Dennis", c:"James", d:"Bjarne", ans:"a"},
        {c:"Python", q:"How to define a block in Python?", a:"Braces {}", b:"Indentation", c:"Semicolon ;", d:"Parenthesis ()", ans:"b"},
        {c:"Python", q:"Keyword to create a function?", a:"func", b:"def", c:"define", d:"function", ans:"b"},
        {c:"Python", q:"Which is an immutable type?", a:"List", b:"Tuple", c:"Set", d:"Dictionary", ans:"b"},
        {c:"Python", q:"Result of 10 // 3?", a:"3.33", b:"3", c:"1", d:"0", ans:"b"},
        {c:"Python", q:"How to add item to list?", a:"add()", b:"append()", c:"insert()", d:"Both b&c", ans:"d"},
        {c:"Python", q:"Is Python case sensitive?", a:"Yes", b:"No", c:"Only for strings", d:"None", ans:"a"},
        {c:"Python", q:"Dictionary key-value separator?", a:",", b:":", c:"-", d:"=", ans:"b"},
        {c:"Python", q:"Extension of python file?", a:".p", b:".py", c:".python", d:".pt", ans:"b"},
        {c:"Python", q:"Which is not a valid variable name?", a:"my_var", b:"2var", c:"_var", d:"var2", ans:"b"},
        {c:"Python", q:"Comment in Python starts with?", a:"//", b:"#", c:"/*", d:"--", ans:"b"},
        {c:"Python", q:"Logical AND in Python?", a:"&&", b:"and", c:"&", d:"amp", ans:"b"},
        {c:"Python", q:"Keyword for inheritance?", a:"extends", b:"(ParentClass)", c:"implements", d:"None", ans:"b"},
        {c:"Python", q:"List in Python is defined by?", a:"[]", b:"()", c:"{}", d:"<>", ans:"a"},
        {c:"Python", q:"Dictionary is defined by?", a:"[]", b:"()", c:"{}", d:"<>", ans:"c"},
        {c:"Python", q:"Output of 'hi' * 2?", a:"hi2", b:"hihi", c:"Error", d:"hi hi", ans:"b"},
        {c:"Python", q:"Function to get length of list?", a:"length()", b:"size()", c:"len()", d:"count()", ans:"c"},
        {c:"Python", q:"Python handles memory via?", a:"Manual", b:"Garbage Collector", c:"Pointers", d:"None", ans:"b"},
        {c:"Python", q:"Which is a membership operator?", a:"in", b:"is", c:"==", d:"not", ans:"a"},
        {c:"Python", q:"'is' operator is for?", a:"Value equality", b:"Identity equality", c:"Assignment", d:"None", ans:"b"},
        {c:"Python", q:"Result of 2 ** 3?", a:"6", b:"8", c:"9", d:"5", ans:"b"},
        {c:"Python", q:"How to create a range from 0 to 4?", a:"range(4)", b:"range(0,5)", c:"range(5)", d:"Both b&c", ans:"d"},
        {c:"Python", q:"Lambda is a?", a:"Keyword", b:"Anonymous function", c:"Variable", d:"Loop", ans:"b"},
        {c:"Python", q:"What is __init__?", a:"Constructor", b:"Destructor", c:"Method", d:"Variable", ans:"a"},
        {c:"Python", q:"Keyword for importing module?", a:"load", b:"include", c:"import", d:"using", ans:"c"},
        {c:"Python", q:"Error handling keywords?", a:"try-except", b:"try-catch", c:"if-else", d:"None", ans:"a"},
        {c:"Python", q:"Can a function return multiple values?", a:"Yes", b:"No", c:"Depends", d:"Only in C", ans:"a"},
        {c:"Python", q:"Boolean values in Python?", a:"true/false", b:"True/False", c:"1/0", d:"None", ans:"b"},
        {c:"Python", q:"PEP 8 is?", a:"Compiler", b:"Style guide", c:"Library", d:"Error", ans:"b"},
        {c:"Python", q:"Module for math functions?", a:"math", b:"cmath", c:"Both", d:"None", ans:"c"},
        {c:"Python", q:"What is slicing?", a:"Cutting list", b:"Accessing range of items", c:"Deleting items", d:"None", ans:"b"},
        {c:"Python", q:"Global variable inside function?", a:"global", b:"static", c:"extern", d:"None", ans:"a"},
        {c:"Python", q:"'pass' keyword is?", a:"Exit loop", b:"Null operation", c:"Skip error", d:"None", ans:"b"},
        {c:"Python", q:"Convert string to int?", a:"int()", b:"str()", c:"float()", d:"None", ans:"a"},
        {c:"Python", q:"Set in Python is?", a:"Ordered", b:"Unordered & Unique", c:"Duplicate allowed", d:"None", ans:"b"},
        {c:"Python", q:"Recursion limit in Python?", a:"100", b:"1000", c:"Infinite", d:"No limit", ans:"b"},
        {c:"Python", q:"What is 'self'?", a:"Keyword", b:"Refers to current instance", c:"Refers to parent", d:"None", ans:"b"},
        {c:"Python", q:"'break' and 'continue' in Python?", a:"Supported", b:"Not supported", c:"Only for 'for'", d:"None", ans:"a"},
        {c:"Python", q:"Which is not a keyword?", a:"elif", b:"else if", c:"if", d:"elif", ans:"b"},
        {c:"Python", q:"Output of bool([])?", a:"True", b:"False", c:"Error", d:"None", ans:"b"},
        {c:"Python", q:"Read input from user?", a:"scanf()", b:"input()", c:"read()", d:"get()", ans:"b"},
        {c:"Python", q:"PIP stands for?", a:"Package Installer for Python", b:"Pre-Indexed Python", c:"Program In Python", d:"None", ans:"a"},
        {c:"Python", q:"List comprehension is?", a:"Short way to create list", b:"Error", c:"Memory leak", d:"None", ans:"a"},
        {c:"Python", q:"Type of '3.14'?", a:"int", b:"float", c:"complex", d:"str", ans:"b"},
        {c:"Python", q:"Module for random numbers?", a:"rand", b:"random", c:"math", d:"None", ans:"b"},
        {c:"Python", q:"Check if key in dict?", a:"key in dict", b:"dict.has(key)", c:"Both", d:"None", ans:"a"},
        {c:"Python", q:"Delete object?", a:"remove", b:"del", c:"clear", d:"drop", ans:"b"},
        {c:"Python", q:"f-string is for?", a:"Formatting", b:"Filtering", c:"Functions", d:"None", ans:"a"},
        {c:"Python", q:"Python was named after?", a:"Snake", b:"Monty Python circus", c:"A person", d:"None", ans:"b"}
    ];

    function openProgTest() {
        document.getElementById('progOverlay').style.display = 'block';
        document.body.style.overflow = 'hidden';
        const area = document.getElementById('progQuizArea');
        area.innerHTML = "";
        
        progData.forEach((data, index) => {
            const card = document.createElement('div');
            card.style = "background:#1a1a1a; border: 1px solid #333; border-radius:10px; padding:25px; margin-bottom:25px; box-shadow:0 5px 15px rgba(0,255,0,0.1);";
            
            card.innerHTML = `
                <div style="background:#004400; color:#00ff00; padding:2px 10px; border-radius:4px; display:inline-block; font-size:12px; margin-bottom:10px;">[${data.c}]</div>
                <p style="font-size:18px; line-height:1.6;">${index+1}. ${data.q}</p>
                <label style="display:block; margin:10px 0; padding:10px; background:#111; border:1px solid #222; cursor:pointer;"><input type="radio" name="progq${index}" value="a"> A) ${data.a}</label>
                <label style="display:block; margin:10px 0; padding:10px; background:#111; border:1px solid #222; cursor:pointer;"><input type="radio" name="progq${index}" value="b"> B) ${data.b}</label>
                <label style="display:block; margin:10px 0; padding:10px; background:#111; border:1px solid #222; cursor:pointer;"><input type="radio" name="progq${index}" value="c"> C) ${data.c}</label>
                <label style="display:block; margin:10px 0; padding:10px; background:#111; border:1px solid #222; cursor:pointer;"><input type="radio" name="progq${index}" value="d"> D) ${data.d}</label>
            `;
            area.appendChild(card);
        });
    }

    function calcProgResult() {
        let corr = 0, wrng = 0, skip = 0;
        progData.forEach((item, index) => {
            const sel = document.querySelector(`input[name="progq${index}"]:checked`);
            if (!sel) skip++;
            else if (sel.value === item.ans) corr++;
            else wrng++;
        });

        document.getElementById('prog-corr').innerText = corr;
        document.getElementById('prog-wrng').innerText = wrng;
        document.getElementById('prog-skip').innerText = skip;
        document.getElementById('perc-prog').innerText = Math.round((corr / progData.length) * 100) + "%";
        document.getElementById('res-modal-prog').style.display = 'flex';
    }

    function closeProgTest() {
        document.getElementById('progOverlay').style.display = 'none';
        document.getElementById('res-modal-prog').style.display = 'none';
        document.body.style.overflow = 'auto';
    }
