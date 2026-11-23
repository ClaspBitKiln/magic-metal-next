/** Local policy check only. Does not register, publish, spend money or schedule work. */
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
export async function loadChannels(){return JSON.parse(await readFile(new URL('../references/channels.json',import.meta.url),'utf8'));}
export function checkPackage(pkg, registry){
 const errors=[], checks=[];
 const p=registry.channels.find(x=>x.id===pkg.platform);
 if(!p)return {status:'blocked',errors:['Unknown platform'],checks};
 if(!p.markets.includes(pkg.market))errors.push('Unsupported target market');
 if(!p.formats.includes(pkg.format))errors.push('Unsupported format');
 if(!pkg.title?.trim()||!pkg.body?.trim())errors.push('Title and body required');
 if(p.automation==='prohibited_without_portal_permission')errors.push('Portal permission required; automation stopped');
 if(p.free==='business_zero_construction'||p.free==='trial_not_permanent_free')errors.push('Not an eligible permanent free business placement');
 if(p.externalLinks===false&&(/https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(pkg.body)||pkg.landingUrl))errors.push('External links/email not permitted in this format');
 if(pkg.format==='photo'){
  if(!pkg.image?.path)errors.push('Image file required');
  if(p.photoOverlays===false&&pkg.image?.overlays?.length)errors.push('Image overlays prohibited; do not hide contacts in images');
  if(p.imageMin&&(!Number.isFinite(pkg.image?.width)||!Number.isFinite(pkg.image?.height)||pkg.image.width<p.imageMin[0]||pkg.image.height<p.imageMin[1]))errors.push('Image dimensions below platform minimum or unverified');
  if(!pkg.image?.rightsConfirmed)checks.push('Verify image rights and correspondence to actual product');
 }
 if(pkg.productGroup==='wire_ropes_china'&&pkg.market!=='RF')errors.push('This wire-rope campaign is RF only');
 if(pkg.market!=='RF'&&pkg.quoteRoute==='tashkent'&&pkg.market!=='UZ')errors.push('Tashkent delivery model cannot be applied to another country');
 if(pkg.price?.nativeCurrency&&p.nativeRUB===false&&pkg.price.nativeCurrency==='RUB')errors.push('Platform has no native RUB; select negotiated price and retain RUB in description');
 if(!pkg.liveFreeConfirmed)checks.push('Confirm current free category/limit without a trial or purchase');
 if(!pkg.eligibilityConfirmed&&p.foreignSeller!=='not_applicable')checks.push('Confirm Russian company eligibility; never invent a local office/phone');
 if(!pkg.duplicateChecked)checks.push('Check existing company/product before creating');
 if(!pkg.rulesChecked)checks.push('Read current rules, automation policy and contact/image restrictions');
 return {status:errors.length?'blocked':checks.length?'needs_verification':'ready_for_authorized_execution',platform:p.id,market:pkg.market,errors,checks,note:'Ready is not submitted or published. Use actual permitted UI/API and save receipts.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const file=process.argv[2];if(!file)throw Error('Usage: node preflight.mjs /private/placement-package.json');const result=checkPackage(JSON.parse(await readFile(file,'utf8')),await loadChannels());console.log(JSON.stringify(result,null,2));if(result.status==='blocked')process.exitCode=2;}
 catch{console.error('Cannot validate package; check private JSON and policy registry. No publication occurred.');process.exitCode=1;}
}
