<pre style="font-size:9pt;line-height:120%">
You can put a note on any page or post with short codes like this:

  [note]Here is the note next[/note]

and if that does not appear exactly where you want it you can adjust the top and left sides like this

  [note <b>top=10 left=-200</b>]A note shifted down <b>10</b> pixels and over to the left <b>200</b> pixels[/note]

Up is negative numbers and down is positive numbers.
Left is negative numbers and right is positive numbers.

Without top or left, the note simply appears to the right of the line where it is placed in the text.

If you put float=true in the [note <b>float=true</b>] then the note will float over the lines below it instead
of taking up space in the paragraph.

Add p=# where # is any number to give the note a priority. Example [note <b>p=3</b>]a priority 3 note[/note]

When your done with a [note], just delete it from the page.
</pre>

<?php
	echo developer_postit_notes_output();

?>