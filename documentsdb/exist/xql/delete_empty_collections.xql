xquery version "3.0";

declare namespace xmldb="http://exist-db.org/xquery/xmldb";
declare namespace f="http://uselessnamespace.com";

declare variable $collection external;

declare function f:emptyCollection($collection-uri as xs:string) {
    let $collections := xmldb:get-child-collections($collection-uri)
    let $resources := xmldb:get-child-resources($collection-uri)
    return count($resources) = 0 and count($collections) = 0
};

declare function f:removeEmptyColl($collection-uri as xs:string) {
    let $removedCollections := for $collection in xmldb:get-child-collections($collection-uri)
                                    return f:removeEmptyColl(concat($collection-uri, '/', $collection))
    return
        if (f:emptyCollection($collection-uri))
        then xmldb:remove($collection-uri)
        else ()
};
(: TODO: return the removed collections :)
let $something := ()
return f:removeEmptyColl($collection)