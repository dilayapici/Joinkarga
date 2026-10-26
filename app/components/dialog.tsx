'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';
export function Dialog({label,onClose,children,className=''}:{label:string;onClose:()=>void;children:ReactNode;className?:string}){
 const root=useRef<HTMLDivElement>(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';root.current?.focus();
  function keydown(event:KeyboardEvent){if(event.key==='Escape'){event.preventDefault();close.current();return;}if(event.key!=='Tab')return;const nodes=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')??[]).filter(node=>node.getClientRects().length);if(!nodes.length){event.preventDefault();return;}const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&(document.activeElement===first||document.activeElement===root.current)){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===root.current)){event.preventDefault();first.focus();}}
  document.addEventListener('keydown',keydown);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keydown);previous?.focus();};
 },[]);
 return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div ref={root} className={'modal '+className} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}><button className="close" aria-label="Close dialog" onClick={onClose}><X size={20}/></button>{children}</div></div>;
}
