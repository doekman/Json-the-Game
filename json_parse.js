function augment(object,fn)
{	let res={};
	for(let propertyName in object)
	{	res[propertyName] = function() 
		{	return fn(object[propertyName], propertyName, Array.prototype.slice.call(arguments)) 
		}
	}
	return res;
}

function jsonParse(tokens, verbosityLevel)
{	let p = augment
	(	{	object: function(token) 
			{	if (token.type == 'group_open' && token.text == '{') 
				{	token = tokens.advance()
				;	if (token)
					{	if (token.type == 'group_close' && token.text == '}')
						{	return true
						}
						else
						{	if (p.members(token))
							{	token = tokens.advance()
							;	if (token && token.type == 'group_close' && token.text == '}')
								{	return true
								}
							}
						}
					}
				}
			}
		,	members: function(token)
			{	if (p.pair(token))
				{	let nextToken = tokens.next
				;	if (nextToken && nextToken.type=='seperator' && nextToken.text==',') 
					{	tokens.advance()	//skip seperator
					;	token = tokens.advance()
					;	if (token && p.members(token))
						{	return true
						}
					}
					else 
					{	return true
					}
				}
			}
		,	pair: function(token)
			{	if (token.type == 'string')
				{	token = tokens.advance()
				;	if (token && token.type == 'seperator' && token.text == ':')
					{	token = tokens.advance()
					;	if (token && p.value(token))
						{	return true
						}
					}
				}
			}
		,	array: function(token)
			{	if (token.type == 'group_open' && token.text == '[')
				{	let openToken = token
				;	token = tokens.advance()
				;	if (token)
					{	if (token.type == 'group_close' && token.text == ']')
						{	openToken.complete = token.complete = true
						;	return true
						}
						else
						{	if (p.elements(token))
							{	token = tokens.advance()
							;	if (token && token.type == 'group_close' && token.text == ']')
								{	openToken.complete = token.complete = true
								;	return true
								}
							}
						}
					}
				}
			}
		,	elements: function(token)
			{	if (p.value(token))
				{	let nextToken = tokens.next
					if (nextToken && nextToken.type=='seperator' && nextToken.text==',')
					{	tokens.advance()	//skip nextToken
					;	token = tokens.advance()
					;	if (token && p.elements(token))
						{	return true
						}
					}
					else
					{	return true
					}
				}
			}
		,	value: function(token)
			{	let res = /^(number|string|value)$/.test(token.type) || p.array(token) || p.object(token)
			;	return res
			}
		}
	,	function(fn, fn_name, args) //add no-token-return-false-handling and debugging	
		{	var token = args[0]
		;	let res=false
		;	if (token)
			{	if (verbosityLevel>=4) console.group(`p.${fn_name}('${token.text}')`, token)
			;	res=fn(token)
			;	if (verbosityLevel>=4) console.groupEnd()
			}
			if (verbosityLevel>=3) console.info(`p.${fn_name}('${token.text}') -> ${res}`)
			return res
		}
	);
	let token = tokens.current;
	return token && ((p.object(token) || p.array(token)) && tokens.advance()===undefined || false);
}


function tokenizeAndParseJson(jsonText, verbosityLevel) 
{	let tokens = new JsonTokenMap(jsonText, true)
;	if (verbosityLevel>=2) console.log(`tokenizeAndParseJson: »${jsonText}«`, tokens.tokens)
;	return jsonParse(tokens, verbosityLevel)
}

tokenizeAndParseJson.test_validJson = function(verbosityLevel)
{	var lines = 
	[	'[]'
	,	'[1,3]'
	,	'[1,  2 ,  3]'
	,	'[true,false,null,19,0.3,1e9,0.33e-3]'
	,	'[[1,2],[3,4]]'
	,	'[[[[[[[[42.0,0]]]]]]]]'
	,	'{}'
	,	'{"jaap":"vlieg eruit"}'
	,	'{"age":42 , "agree":true, "primes" \n:\r\n [3,7,11]}'
	,	'[{"x":[12]}]'
	,	'{"very":{"super":{"duper":{"nesting":{"level":{"we":{"have":{"here":{",":{"right":{"or":"what?"}}}}}}}}}}}'
	]
;	let line=''
;	try
	{	for(line of lines)
		{	var res = tokenizeAndParseJson(line,verbosityLevel)
		;	if (!res) throw new Error(`Niet goed (${res})`)
		}
	;	if(verbosityLevel>=1) console.info("JSON looks OK to me!")
	}
	catch(ex)
	{	if(verbosityLevel>=1) console.error(`Parser error (line:${line}): `, ex)
	}
}
//tokenizeAndParseJson.test_validJson(2)
