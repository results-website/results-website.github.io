import {defaultReview} from './default-review.mjs?v=normal-url-1';

const decode=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));
export const defaultDatasetId=defaultReview.datasetId;
export const defaultReviewKey=()=>defaultReview.bootstrapKey;
export function privateReviewKey(){return new URLSearchParams(location.hash.slice(1)).get('reviewKey');}
export function clearPrivateFragment(){const hash=new URLSearchParams(location.hash.slice(1));hash.delete('reviewKey');history.replaceState(null,'',location.pathname+location.search+(hash.size?'#'+hash.toString():''));}

export async function decryptDefault(ciphertext,encodedKey){
  if(!/^[A-Za-z0-9_-]{43}$/.test(encodedKey))throw Error('Open the complete private review link to load this exam.');
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',ciphertext));
  const hex=[...digest].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(hex!==defaultReview.sha256)throw Error('The default review download is incomplete. Reload the page to try again.');
  const key=await crypto.subtle.importKey('raw',decode(encodedKey),{name:'AES-GCM'},false,['decrypt']);
  let compressed;
  try{compressed=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(defaultReview.iv),additionalData:new TextEncoder().encode(defaultReview.format+':'+defaultReview.datasetId),tagLength:128},key,ciphertext);}
  catch{throw Error('This private review link could not open the exam. Use the original private link.');}
  const text=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  const dataset=JSON.parse(text);
  if(dataset.dataset_id!==defaultReview.datasetId)throw Error('The default review has an unexpected dataset identity.');
  return dataset;
}

export async function loadDefault(encodedKey,progress=()=>{}){
  if(!/^[A-Za-z0-9_-]{43}$/.test(encodedKey))throw Error('Open the complete private review link to load this exam.');
  const response=await fetch(new URL(defaultReview.url,import.meta.url),{credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('The default exam could not be downloaded. Please reload to try again.');
  let ciphertext;
  if(response.body){
    const reader=response.body.getReader(),chunks=[];let length=0;
    for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);length+=value.length;progress(Math.min(99,Math.round(100*length/defaultReview.bytes)));}
    ciphertext=new Uint8Array(length);let offset=0;for(const chunk of chunks){ciphertext.set(chunk,offset);offset+=chunk.length;}
  }else ciphertext=new Uint8Array(await response.arrayBuffer());
  progress(100);return decryptDefault(ciphertext,encodedKey);
}
