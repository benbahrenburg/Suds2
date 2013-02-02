/*jslint maxerr:1000 */
/**
* suds2 is a fork of suds by Kevin Whinnery
* update are available for suds2 at: http://github.com/benbahrenburg/Suds2
*
* Suds: A Lightweight JavaScript SOAP Client
* Copyright: 2009 Kevin Whinnery (http://www.kevinwhinnery.com)
* License: http://www.apache.org/licenses/LICENSE-2.0.html
* Source: http://github.com/kwhinnery/Suds
*
*/
var SudsClient = function(_options) {
  
  //A generic extend function - thanks MooTools
  function extend(original, extended) {
    for (var key in (extended || {})) {
      if (original.hasOwnProperty(key)) {
        original[key] = extended[key];
      }
    }
    return original;
  }

  function endWith(str,suffix){
		str = str +'';
		var lastIndex = str.lastIndexOf(suffix);
    	return (lastIndex != -1) && (lastIndex + suffix.length == str.length);
  };
    
  //Check if an object is an array
  function isArray(obj) {
    return Object.prototype.toString.call(obj) == '[object Array]';
  }
  
  //Grab an XMLHTTPRequest Object
  function getXHR() {
     return Titanium.Network.createHTTPClient();
  }
  
  //Parse a string and create an XML DOM object
  function xmlDomFromString(_xml) {
    var xmlDoc = Titanium.XML.parseString(_xml);
    return xmlDoc;
  };
  
  // Convert a JavaScript object to an XML string - takes either an
  function convertToXml(_obj, namespacePrefix) {
    var xml = '';
    if (isArray(_obj)) {
      for (var i = 0; i < _obj.length; i++) {
        xml += convertToXml(_obj[i], namespacePrefix);
      }
    } else {
      //For now assuming we either have an array or an object graph
      for (var key in _obj) {
        if (namespacePrefix && namespacePrefix.length) {
          xml += '<' + namespacePrefix + ':' + key + '>';
        } else {
          xml += '<'+key+'>';
        }
        if (isArray(_obj[key]) || (typeof _obj[key] == 'object' && _obj[key] != null)) {
          xml += convertToXml(_obj[key]);
        }
        else {
          xml += _obj[key];
        }
        if (namespacePrefix && namespacePrefix.length) {
          xml += '</' + namespacePrefix + ':' + key + '>';
        } else {
          xml += '</'+key+'>';
        }
      }
    }
    return xml;
  }
  
  // Client Configuration
  var config = extend({
    endpoint:'http://localhost',
    targetNamespace: 'http://localhost',
    envelopeBegin: '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:ns0="PLACEHOLDER" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>',
    envelopeEnd: '</soap:Body></soap:Envelope>',
    includeNS : true,
    addTargetSchema : false,
    ns:'ns0'
  },_options);
  
  function wrapNS(nsOnly){
  	if(config.includeNS){
  		return ((nsOnly) ? config.ns :  (config.ns + ':'));
  	}else{
  		return '';
  	}
  };
  
  function addTargetSchema(){
   	if(config.addTargetSchema){
   		var temp = config.targetNamespace;
   		if(endWith(config.targetNamespace,'/')){
   			temp = temp.substr(0,(temp.length -1)); 
   		}
   		return ' xmlns="' + temp + '"';  		
	}else{
		return '';
	}
  };
  
  // Invoke a web service
  this.invoke = function(_soapAction,_body,_callback) {    
    //Build request body 
    var body = _body;
    
    //Allow straight string input for XML body - if not, build from object

    if (typeof body !== 'string') {
      body = '<' + wrapNS(false) +_soapAction + addTargetSchema() + '>';
      body += convertToXml(_body, wrapNS(true));
      body += '</' + wrapNS(false) +_soapAction+'>';
    }
        
    var ebegin = config.envelopeBegin;
    config.envelopeBegin = ebegin.replace('PLACEHOLDER', config.targetNamespace);
    
    //Build Soapaction header - if no trailing slash in namespace, need to splice one in for soap action
    var soapAction = '';
    if (config.targetNamespace.lastIndexOf('/') != config.targetNamespace.length - 1) {
      soapAction = config.targetNamespace+'/'+_soapAction;
    }
    else {
      soapAction = config.targetNamespace+_soapAction;
    }
    
    //POST XML document to service endpoint
    var xhr = getXHR();
    xhr.onload = function() {
      _callback.call(this, xmlDomFromString(this.responseText));
    };
    xhr.open('POST',config.endpoint);
		xhr.setRequestHeader('Content-Type', 'text/xml');
		xhr.setRequestHeader('SOAPAction', soapAction);
		xhr.send(config.envelopeBegin+body+config.envelopeEnd);
  };
};


module.exports = SudsClient;