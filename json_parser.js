function jsonTokenize(line) 
{	let remaining = line
	,   tokens = []
;	while(remaining.length > 0) 
	{	let tm = arguments.callee.jsonTokensMatchers.find( tm => tm.rx.exec(remaining)!==null )
	;	if (!tm) throw new Error('No token found (should never happen)')
	;	tokens.push({text:RegExp.lastMatch, type:tm.type, complete:tm.complete})
	;	remaining = remaining.substr(RegExp.lastMatch.length)
	}
	return tokens
}
jsonTokenize.jsonTokensMatchers = 
[	{ type:'group_open',  complete:false, rx:/^[[{]/}
,	{ type:'group_close', complete:false, rx:/^[}\]]/}
,	{ type:'seperator',   complete:true,  rx:/^[:,]/}
,   { type:'string',      complete:true,  rx:/^"([^"\\]|\\(["\\/bfnrt]|u[0-9-a-fA-F]{4}))*"/}
,   { type:'number',      complete:true,  rx:/^-?(0|[1-9]\d*)(\.\d+)?([eE][-+]?\d+)?/}
,   { type:'value',       complete:true,  rx:/^null|true|false/}
,   { type:'whitespace',  complete:true,  rx:/^[\s\uFEFF\xA0]+/}
// incomplete token matchers
,	{ type:'string',      complete:false, rx:/^"([^"\\]|\\(["\\/bfnrt]|u[0-9-a-fA-F]{4}))*(\\(["\\/bfnrt]|u[0-9-a-fA-F]{0,4})?)?$/}
,   { type:'number',      complete:false, rx:/^(-?(0|[1-9]\d*)(\.\d+)?([eE][-+]?\d*)?|-|-?(0|[1-9]\d*)\.)$/}
,   { type:'value',       complete:false, rx:/^(n(u(ll?)?)?|t(r(ue?)?)?|f(a(l(se?)?)?)?)$/}
// otherwise, it's an error
,   { type:'error',       complete:false, rx:/^.+$/}
]


//--| tests
jsonTokenize.test_tokens = function(verbose)
{	let nrTests = 0
	,   jsonTest = function(json, type, complete, text, onlyTestFirst) 
		{	nrTests++
		;	let tokens = jsonTokenize(json)
		;	if (verbose) console.log(tokens)
		;	if (arguments.length < 4) text = json
		;	if (arguments.length >= 5 && tokens.length > 1) tokens = [tokens[0]]
		;	if (tokens.length!=1) 
			{	console.assert(tokens.length==1, `Expected to find one token, but found ${tokens.length}`)
			}
			else 
			{	let token = tokens[0]
			;	console.assert(token.type==type, `Json »${json}« expected to be type »${type}« (is »${token.type}«)`)
			;	console.assert(token.text==text, `Json »${json}« expected to be text »${text}« (is »${token.text}«)`)
			;	console.assert(token.complete==complete, `Json »${json}« expected to be complete: »${complete}« (is »${token.complete}«)`)
			}
		}
;	jsonTest('{', 'group_open', false)
;	jsonTest('{12', 'group_open', false, '{', true)
;	jsonTest('[', 'group_open', false)
;	jsonTest('}', 'group_close', false)
;	jsonTest(']', 'group_close', false)
;	jsonTest(':', 'seperator', true)
;	jsonTest('"test"', 'string', true)
;	jsonTest('"test":', 'string', true, '"test"', true)
;	jsonTest('"test: \\"hoi\\""', 'string', true)
;	jsonTest('"test: \\\\-\\/=\\b-\\f=\\n\\r\\txyz"', 'string', true)
;	jsonTest('"test', 'string', false)
;	jsonTest('"test\\', 'string', false)
;	jsonTest('"test\\u0', 'string', false)
;	jsonTest('"\\u263a\\uFE0e"', 'string', true)
;	jsonTest('true', 'value', true)
;	jsonTest('t', 'value', false)
;	jsonTest('false', 'value', true)
;	jsonTest('f', 'value', false)
;	jsonTest('null', 'value', true)
;	jsonTest('n', 'value', false)
;	jsonTest('-0', 'number', true)
;	jsonTest('-1', 'number', true)
;	jsonTest('12', 'number', true)
;	jsonTest('1.0', 'number', true)
;	jsonTest('1e3', 'number', true)
;	jsonTest('0.321E+33', 'number', true)
;	jsonTest('-1023.007e-0611', 'number', true)
;	let msg = `Token tests ready, ran ${nrTests} tests`
;	if (verbose) console.info(msg)
	return msg
}

jsonTokenize.test_tokens(true);
