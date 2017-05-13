class JsonTokenMap
{	constructor(jsonText, doSkipWhiteSpace) 
	{	this.tokens = []
	;	this.tokenize(jsonText)
	;	this.doSkipWhiteSpace = !!doSkipWhiteSpace
	;	this.reset()
	}
	
	tokenize(jsonText)
	{	let remaining = jsonText
		,	index     = 0
	;	while(remaining.length > 0) 
		{	let tm = JsonTokenMap.jsonTokensMatchers.find( tm => tm.rx.exec(remaining)!==null )
		;	if (!tm) throw new Error('No token found (should never happen)')
		;	this.tokens.push({text:RegExp.lastMatch, type:tm.type, complete:tm.complete, index:index, len:RegExp.lastMatch.length, remaining:remaining})
		;	index += RegExp.lastMatch.length
		;	remaining = remaining.substr(RegExp.lastMatch.length)
		}
	}
	
	reset()
	{	this.tokenNr = -1
	;	this.advance()
	}
	
	advance() 
	{	this.tokenNr++
	;	while (this.doSkipWhiteSpace && this.current && this.current.type == "whitespace")
		{	this.tokenNr++
		}
	;	return this.current
	}
	
	toString(seperator)
	{	return this.tokens.map(token => token.text).join(seperator || '')
	}
	
	getToken(index) 
	{	return index >= 0 && index < this.tokens.length ? this.tokens[index] : undefined 
	}
	
	get current() 
	{	return this.getToken(this.tokenNr)
	}	
	get next() 
	{	let tokenNr = this.tokenNr
	;	do 
		{	var res = this.getToken(++tokenNr)
		}	while (this.doSkipWhiteSpace && res && res.type == 'whitespace')
	;	return res;
	}
	get length() 
	{	return this.tokens.length
	}
}

JsonTokenMap.jsonTokensMatchers = 
[	{ type:'group_open',	complete:false,	rx:/^[[{]/}
,	{ type:'group_close',	complete:false,	rx:/^[}\]]/}
,	{ type:'seperator',		complete:true,	rx:/^[:,]/}
,	{ type:'string',		complete:true,	rx:/^"([^"\\\u0000-\u001f\u007f]|\\(["\\/bfnrt]|u[0-9-a-fA-F]{4}))*"/}
,	{ type:'number',		complete:true,	rx:/^-?(0|[1-9]\d*)(\.\d+)?([eE][-+]?\d+)?/}
,	{ type:'value',			complete:true,	rx:/^(null|true|false)/}
,	{ type:'whitespace',	complete:true,	rx:/^([ \f\t\v]+(\r|\n)?|\r|\n)/} //"whitespace", always ends with newline (because of wrap in UI)
// incomplete token matchers
,	{ type:'string',		complete:false,	rx:/^"([^"\\\u0000-\u001f\u007f]|\\(["\\/bfnrt]|u[0-9-a-fA-F]{4}))*(\\(["\\/bfnrt]|u[0-9-a-fA-F]{0,4})?)?$/}
// TODO: incomplete getallen willen nog niet met deze contructie ("1e" wordt ["1","e"]; "1." wordt ["1","."])
,	{ type:'number',		complete:false,	rx:/^(-?(0|[1-9]\d*)(\.\d+)?([eE][-+]?\d*)?|-|-?(0|[1-9]\d*)\.)$/}
,	{ type:'value',			complete:false,	rx:/^(n(u(l)?)?|t(r(u)?)?|f(a(l(s)?)?)?)\b/}
// otherwise, it's an error
,	{ type:'error',			complete:false,	rx:/^[^]+/}
]



//--| tests
JsonTokenMap.test_tokens = function(verbosityLevel)
{	if (typeof verbosityLevel!='number') verbosityLevel=1
;	let nrTests = 0
;	function jsonTest(json, type, complete, text, onlyTestFirst) 
	{	nrTests++
	;	let tokens = new JsonTokenMap(json)
	;	if (verbosityLevel>=3) console.log(`jsonTest(${json}|${type}|${complete})`, tokens)
	;	if (arguments.length < 4) text = json
	;	if (tokens.length!=1 && !onlyTestFirst) 
		{	console.assert(tokens.length==1, `Expected to find one token, but found ${tokens.length}`)
		}
		else 
		{	let token = tokens.current
		;	console.assert(token!=undefined, `Json »${json}« expected to result in a token`)
			if (token!=undefined)
			{	console.assert(token.type==type, `Json »${json}« expected to be type »${type}« (is »${token.type}«)`)
			;	console.assert(token.text==text, `Json »${json}« expected to be text »${text}« (is »${token.text}«)`)
			;	console.assert(token.complete==complete, `Json »${json}« expected to be complete: »${complete}« (is »${token.complete}«)`)
			}
		}
	}
// groups & seperators
;	jsonTest('{', 'group_open', false)
;	jsonTest('{12', 'group_open', false, '{', true)
;	jsonTest('[', 'group_open', false)
;	jsonTest('}', 'group_close', false)
;	jsonTest(']', 'group_close', false)
;	jsonTest(':', 'seperator', true)
;	jsonTest(': true', 'seperator', true, ':', true)
// strings
;	jsonTest('"test"', 'string', true)
;	jsonTest('"test":', 'string', true, '"test"', true)
;	jsonTest('"test: \\"hoi\\""', 'string', true)
;	jsonTest('"test: \\\\-\\/=\\b-\\f=\\n\\r\\txyz"', 'string', true)
;	jsonTest('"test', 'string', false)
;	jsonTest('"test\\', 'string', false)
;	jsonTest('"test\\u0', 'string', false)
;	jsonTest('"\\u263a\\uFE0e"', 'string', true)
;	jsonTest('"ding\tdong"', 'error', false)
;	jsonTest('"no\nnew\rlines"', 'error', false)
// values
;	jsonTest('true', 'value', true)
;	jsonTest('t', 'value', false)
;	jsonTest('tr\n,', 'value', false, 'tr', true)
;	jsonTest('false', 'value', true)
;	jsonTest('f', 'value', false)
;	jsonTest('null', 'value', true)
;	jsonTest('n', 'value', false)
// numbers
;	jsonTest('-0', 'number', true)
;	jsonTest('-1', 'number', true)
;	jsonTest('12', 'number', true)
;	jsonTest('1.0', 'number', true)
;	jsonTest('1e3', 'number', true)
;	jsonTest('0.321E+33', 'number', true)
;	jsonTest('-1023.007e-0611', 'number', true)
;	jsonTest('200\n', 'number', true, '200', true)
;	let msg = `Token tests ready, ran ${nrTests} tests`
;	if (verbosityLevel>=1) console.info(msg)
	return msg
}



//JsonTokenMap.test_tokens(3);
