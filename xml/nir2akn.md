# NIR2AKN

## Conversion process
- Nir file is submitted to the */xml/nir2akn* endpoint.
- */xml/xml/nir.js* fixes input known issues in the input xml (it strips processing instructions, replaces special characters, fixes NIR namespace when missing or wrong).
- File is converted by Saxon with the big XSLT */xml/xslt/nir2akn.xsl*
- Result is returned in the HTTP response.


## Unit tests

It is critical to keep the unit tests in */spec* updated.  
They can be run with the command *npm test*.  
I started writing tests too late in the process, still they are invaluable in preventing regressions.
