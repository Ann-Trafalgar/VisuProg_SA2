// New practice questions written from the supplied Module 03 and Module 04 slides.
// Each row is [prompt, choices, correct choice, short explanation].
const module03 = [
  ["In the slide's textSample(), what color is the string FEU-TECH?", ["Red", "Blue", "Green", "Yellow"], "B", "glColor3f(0.0f, 0.0f, 1.0f) selects blue before the string is drawn."],
  ["Which call makes subsequent drawing green in the module's RGB examples?", ["glColor3f(1.0f, 0.0f, 0.0f)", "glColor3f(0.0f, 0.0f, 1.0f)", "glColor3f(0.0f, 1.0f, 0.0f)", "glColor3f(1.0f, 1.0f, 1.0f)"], "C", "The green component is the middle argument."],
  ["What color does glColor3f(1.0f, 1.0f, 0.0f) select in the module's color table?", ["White", "Yellow", "Magenta", "Blue"], "B", "Full red and green with no blue produce yellow."],
  ["In textSample(), which string is passed to glutBitmapString()?", ["My First OpenGL", "FEU-TECH", "Hello World", "GLUT"], "B", "The sample stores FEU-TECH in str and passes str to glutBitmapString()."],
  ["Which bitmap font is used by the sample text drawing code?", ["GLUT_BITMAP_HELVETICA_18", "GLUT_BITMAP_HELVETICA_12", "GLUT_STROKE_ROMAN", "GLUT_BITMAP_9_BY_15"], "A", "The sample calls glutBitmapString(GLUT_BITMAP_HELVETICA_18, str)."],
  ["If px starts at 0.50f, what is its value after one 'a' key press in keyboardMonitor()?", ["0.52f", "0.50f", "0.48f", "0.00f"], "C", "The 'a' branch subtracts 0.02f from px."],
  ["If px starts at 0.00f, what is its value after pressing 'd' twice?", ["-0.04f", "0.02f", "0.04f", "2.00f"], "C", "Each 'd' press adds 0.02f."],
  ["After an unrecognized key resets px, which call asks GLUT to show the new position?", ["glutPostRedisplay()", "glutCreateWindow()", "glRasterPos2f()", "glutInit()"], "A", "keyboardMonitor() calls glutPostRedisplay() after its switch statement."],
  ["In the module's defaultDisplay(), which value determines the text's vertical raster position?", ["key", "state", "px", "py"], "D", "The drawing code passes px and py to glRasterPos2f(px, py)."],
  ["What does glutBitmapString() receive as its second argument in the sample?", ["The window title", "The text string str", "A mouse button", "A timer interval"], "B", "The second argument is str, the character array containing FEU-TECH."],
  ["In mouseMonitor(), what message is printed when the left button is pressed down?", ["Left button was released...", "Right button was clicked...", "Left button was clicked...", "Mouse has left the application"], "C", "The left button branch checks for GLUT_DOWN and prints the clicked message."],
  ["In mouseMonitor(), what message is printed when the left button is released?", ["Left button was released...", "Middle button was clicked...", "Left button was clicked...", "Mouse has re-entered the application"], "A", "The left button branch's else case handles the release."],
  ["What is printed by the sample's right-button branch, regardless of the button state?", ["Right button was released...", "Right button was clicked...", "Left button was clicked...", "Nothing"], "B", "Unlike the left-button branch, the sample's right-button branch does not inspect state."],
  ["Which values are printed at the end of every mouseMonitor() call in the sample?", ["px and py", "button and state", "x and y", "window width and height"], "C", "The sample ends with cout << x << \" \" << y << endl."],
  ["What does mouseEntryDetector() print when state is GLUT_LEFT?", ["Mouse has re-entered the application", "Mouse has left the application", "Left button was clicked", "The window is full screen"], "B", "GLUT_LEFT in the entry callback means the pointer left the window."],
  ["In animateString(int value), what happens to px when value is 1?", ["It decreases by 0.02", "It increases by 0.02", "It resets to 0", "It becomes 1"], "B", "The value == 1 branch adds 0.02 to px."],
  ["In animateString(int value), what happens to px when value is 2?", ["It decreases by 0.02", "It increases by 0.02", "It resets to 0", "It doubles"], "A", "Every value other than 1 takes the else branch and subtracts 0.02."],
  ["What delay does Sleep(1000) add to each call of the sample animateText() function?", ["1 millisecond", "100 milliseconds", "1 second", "10 seconds"], "C", "Sleep uses milliseconds, so 1000 milliseconds equals one second."],
  ["Which registration call connects detectPassiveMotion() to movement with no mouse button pressed?", ["glutMotionFunc(detectPassiveMotion)", "glutPassiveMotionFunc(detectPassiveMotion)", "glutMouseFunc(detectPassiveMotion)", "glutEntryFunc(detectPassiveMotion)"], "B", "The sample registers detectPassiveMotion with glutPassiveMotionFunc()."],
  ["In the module's sample, when does the display callback get registered?", ["After glutMainLoop() returns", "Before glutCreateWindow()", "After creating the window and before glutMainLoop()", "Only inside keyboardMonitor()"], "C", "main() creates the window, registers glutDisplayFunc(defaultDisplay), then starts glutMainLoop()."]
];

const module04 = [
  ["How many glVertex2f() calls appear inside the sample triangle() function?", ["2", "3", "4", "12"], "B", "triangle() specifies three vertices between glBegin(GL_TRIANGLES) and glEnd()."],
  ["How many points does the sample point() function submit?", ["1", "2", "3", "4"], "D", "point() contains four glVertex2f() calls inside GL_POINTS."],
  ["What size is passed to glPointSize() in the sample point() function?", ["1.0", "4.0", "12.0", "20.0"], "D", "The sample calls glPointSize(20.0)."],
  ["Where is the top vertex of the sample triangle() located?", ["(0.0, 0.75)", "(-0.75, 0.0)", "(0.75, 0.0)", "(0.0, -0.75)"], "A", "The first triangle vertex is glVertex2f(0.0f, .75f)."],
  ["In glColor4f(.16f, .72f, .08f, 1.0f), what does the fourth value represent?", ["Vertex count", "Alpha", "Point size", "Array index"], "B", "The four components are red, green, blue, and alpha."],
  ["In the immediate-mode sample, which two functions does defaultDisplay() call to draw its shapes?", ["point() and triangle()", "rectangle() and point()", "displayTriangles() and rectangle()", "triangleleft() and triangleright()"], "A", "The first Module 04 sample calls point() and triangle() before glFlush()."],
  ["How many triangles are represented by 12 sequential vertices drawn with GL_TRIANGLES?", ["2", "3", "4", "12"], "C", "GL_TRIANGLES consumes three vertices per triangle, so 12 vertices make four triangles."],
  ["How many GLfloat coordinate values are needed for 12 vertices with three coordinates each?", ["12", "24", "36", "48"], "C", "Twelve vertices times three coordinate components equals 36 values."],
  ["In the module's vertex-array sample, what does glColorPointer(3, GL_FLOAT, 0, colors) point to?", ["The quad vertices", "The per-vertex color data", "The window dimensions", "The triangle indices"], "B", "The final argument colors identifies the array supplying color values."],
  ["Which two client states are enabled before drawing the colored triangles in displayTriangles()?", ["GL_VERTEX_ARRAY and GL_COLOR_ARRAY", "GL_POINTS and GL_QUADS", "GL_COLOR_BUFFER_BIT and GL_TRIANGLES", "GL_FLOAT and GL_COLOR_ARRAY"], "A", "displayTriangles() enables both vertex and color arrays."],
  ["What does the zero in glDrawArrays(GL_TRIANGLES, 0, 12) specify?", ["The first array element to draw", "The number of triangles", "The vertex size", "The buffer object version"], "A", "The second glDrawArrays argument is the starting vertex index."],
  ["After drawing the colored triangles, which client states does displayTriangles() disable?", ["GL_POINTS and GL_QUADS", "GL_VERTEX_ARRAY and GL_COLOR_ARRAY", "GL_FLOAT and GL_TRIANGLES", "GL_COLOR_BUFFER_BIT only"], "B", "The sample disables both arrays it enabled."],
  ["What primitive type does the vertex-array rectangle() pass to glDrawArrays()?", ["GL_POINTS", "GL_LINES", "GL_TRIANGLES", "GL_QUADS"], "D", "The rectangle sample uses glDrawArrays(GL_QUADS, 0, 4)."],
  ["How many entries from quadvertices does glDrawArrays(GL_QUADS, 0, 4) use?", ["1", "2", "3", "4"], "D", "The final argument is the count of four vertices."],
  ["What color does the vertex-array rectangle() set before drawing?", ["Red", "Blue", "Green", "White"], "C", "It calls glColor3f(0.0f, 1.0f, 0.0f) before drawing."],
  ["Which vertex-array function supplies quadvertices as the current vertex source?", ["glDrawArrays(GL_QUADS, 0, 4)", "glVertexPointer(3, GL_FLOAT, 0, quadvertices)", "glColorPointer(3, GL_FLOAT, 0, colors)", "glFlush()"], "B", "glVertexPointer() sets the array location and format."],
  ["In the immediate-mode rectangle(), how many vertices are enclosed by glBegin(GL_QUADS) and glEnd()?", ["2", "3", "4", "12"], "C", "The rectangle submits four glVertex2f() calls."],
  ["Which function in the multiple-primitive sample draws the four triangles from trianglevertices?", ["displayTriangles()", "rectangle()", "defaultDisplay()", "point()"], "A", "displayTriangles() configures the arrays and draws GL_TRIANGLES."],
  ["Why can indexed drawing reuse a vertex without duplicating its coordinates in the vertex array?", ["Each index can refer to an existing vertex", "GL_QUADS creates all missing vertices", "glFlush() copies the vertex", "Every vertex has a separate window"], "A", "glDrawElements() uses indices to reference vertices already stored in the array."],
  ["What is the final step of defaultDisplay() after it draws displayTriangles() and rectangle() in the vertex-array sample?", ["glutInit()", "glColorPointer()", "glFlush()", "glutCreateWindow()"], "C", "The sample calls glFlush() after both drawing functions."]
];

module.exports = { module03, module04 };
