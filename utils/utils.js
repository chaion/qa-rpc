var rlp = require("aion-rlp");
var AionLong = rlp.AionLong;
var aionLib = require('../packages/aion-lib/src/index.js');
var blake2b256 = aionLib.crypto.blake2b256;
var toBuffer = aionLib.formats.toBuffer;
var Buffer = aionLib.formatsBuffer;
var bufferToZeroXHex = aionLib.formats.bufferToZeroXHEX;
var nacl = aionLib.crypto.nacl;
var aionPubSigLen = aionLib.accounts.aionPubSigLen;




var BigNumber = require("bignumber.js");
function str2Obj(str,delimiter,separator){
		
		str = str.substring(1,str.length-1);
		
		var obj = {};
		if(str.length ===0) return obj;
		str.split(delimiter).forEach((item)=>{
			var pair = item.split(separator);
			if(pair[0]=='limit' || pair[0]=='block'){
				obj[pair[0]] = parseInt(pair[1]);
			}else if(pair[0]=='time'){
				obj[pair[0]] = Date.now();
			}else{
				if(/^{\S*}$/.test(pair[1])){
					pair[1]= str2Obj(pair[1],'+','-');
				}
				obj[pair[0]] = pair[1];
			}
		});
		return obj;
}
function dec2Hex(number){
	return "0x"+number.toString(16);
}
function getTimeStampHex(){
	return dec2Hex(Date.now());
}

function getCurretNonce(provider, accAddr){
	return provider.sendRequest("utils-getValidNonceValue", "eth_getTransactionCount",[accAddr]);
}
function getGasPrice(provider){
	return provider.sendRequest("utils-getGasPrice","eth_gasPrice",[]);
}

function getGasPrice(provider,accAddr){
	return provider.sendRequest("utils-getBalance","eth_getBalance",[accAddr]);
}

/*
	Use account private key to encode transaction object to HEX
	@param txObj(Object):{to: accAddr, value: number, data: number, gas: number, gasPrice:account, nonce:hex,type:?, timestamp:Date.now()*1000} 
	@param account(Object){_privateKey: number, privateKey:hex, publicKey:buffer?, addr:accountAddress}
*/


async function getRawTx(provider,txObj,account){
	let preEncodeSeq = [];
	let expectSeq =['nonce','to','value','data','timestamp','gas','gasPrice','type'];
	txObj.timestamp = tx.timestamp || Date.now() * 1000;
	txObj.type = toAionLong(txObj.type || 1);
	txObj.nonce = txObj.nonce || (await getCurrentNonce(provider,account.addr)).result;
	txObj.gas = toAionLong(txObj.gas);
	txObj.gasPrice = txObj.gasPrice || (await getGasPrice(provider)).result;
	txObj.gasPrice = toAionLong(toObj.gasPrice);

	expectSeq.foreach((property)=>{preEncodeSeq.push(txObj[property]);});
	
	let rlpEncoded = rlp.encode(preEncodeSeq);
	let hash = blake2b256(rlpEncoded);
	let signature = toBuffer(nacl.sign.detached(hash,account._privateKey));
	// ?need? verity nacl signature check aion_web3.web3-eth-accounts line 229 - 231
	let aionPubSig = Buffer.concat([account.publicKey,signature],aionPubSigLen);
	let rawTx = rlp.decode(rlpEncoded).concat(aionPubSig);
	let rawTransaction = rlp.encode(rawTx);
	return {
		messageHash:bufferToZeroXHex(hash),
		signature:bufferToZeraXHex(aionPubSig),
		rawTransaction:bufferToZeroXHex(rawTransaction)
	}
}



var Utils={

	//conversion
	hex2Dec:(hex)=>{return parseInt(num);},
	dec2Hex:dec2Hex,
	string2Hex:(str)=>{
		if(/^0x/.test(str)) return str;
		hex = "0x";
		for(let i=0; i < str.length;i++){
			let ext = str.charCodeAt(i).toString(16);
			ext=(ext.length==2)?ext:'0'+ext;
			hex = hex+ext;
		}
		return hex;
	},
	//
	str2Obj:str2Obj,
	getBigNumber:(number)=>{return new BigNumber(number);},
	isBIGNUMBER:()=>{
		return {test:(value)=>{return BigNumber.isBigNumber(value);}};
	},
	isValidTimeStamp:()=>{
		return {test:(ts)=>{
			if(!/^0x/.test(ts)|| ts.length !== 16) return false;
			ts = parseInt(ts);
			let cur_ts =Date.now();
			return (cur_ts>ts && ts > cur_ts-2000);
		}};
	},
	getGasPrice:getGasPrice,
	getRawTx:getRawTx,
	getCurrentNonce:getCurrentNonce
}

module.exports = Utils;