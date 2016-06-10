
# Aknservices architecture

Aknservices is an Express application divided in submodules.

## documentsdb

This is the module used by LIME.

Endpoints:
- *documentsdb/Users*: handles user registration, login and preferences
- *documentsdb/Documents*: generic document repository. It supports both the Exist and Filesystem backend.
- *documentsdb/Export*: service for temporarily exporting a file in the document repository to a public url.

Mongodb is used for storing users. Filesystem or ExistDb is used to store files.

## xml

This submodule should contain generic xml services, like validation and or xslt conversions.   
Currently it only contains the NIR to AkomaNtoso converter.

## spec
Contains jasmine unit-tests. Currently it is only used by nir2akn. 
