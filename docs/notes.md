

Random notes
============

Mongo tricks
------------

1. Exporting a collection from MongoDB and suppressing the "_id" field:

   ``` 
   % mongoexport --db __DB__ --collection __COLLECTION__ --pretty | sed -e '/"_id":/ { N;N; d; }'
   ``` 

   Replace the __DB__ and __COLLECTION__ with appropriate values.  The __sed__ 
   command will strip out the line containing "_id": and the following two lines, so 
   you must use the --pretty option for this to work correctly.


