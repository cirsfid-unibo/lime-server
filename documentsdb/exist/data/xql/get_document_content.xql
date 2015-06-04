(: Declare the namespace for the ajax functions in wawe :)
declare namespace ajax = "http://www.wawe.com/ajax";

(: Declare the namespace for functions of the exist xml db :)
declare namespace xdb="http://exist-db.org/xquery/xmldb";

(: Declare the namespace for akomantoso :)
declare namespace akn="http://www.akomantoso.org/2.0";

(: Declare the namespace for akomantoso :)
declare namespace xsi="http://www.w3.org/2001/XMLSchema-instance";

(: This function return an XML containig all the collections and the files in the given collection :)
declare function ajax:getFileXML($xmlFile as xs:string) as 
node()* { 
     ( 
		let $doc := doc($xmlFile)
		(: Returns an XML fragment describing the collection :)
      	return 
			 $doc
	) 
}; 

(: Calls the function that lists the collections getting the collection name from the given GET parameter :)
declare variable $file external;
(: Get the username and the password passed by the server :)
declare variable $userName external;
declare variable $password external;


(: Exist does a urldecode with the parameters of the request! :)
let $encodedFile := replace($file, ' ', '%20')

(: Login the user :)
let $userLogin := xmldb:login('/db', $userName, $password)

return 
	ajax:getFileXML($encodedFile)