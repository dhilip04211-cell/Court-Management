export function AuthPrompt({ onSignIn }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"50px 20px",textAlign:"center"}}>
      <div style={{fontSize:32}}>🔐</div>
      <div style={{fontSize:16,fontWeight:700,color:"var(--gold)"}}>Authentication Required</div>
      <div style={{fontSize:13,color:"var(--txt2)",maxWidth:360}}>Sign in with Google to access FIR records.</div>
      <button className="btn btn-g" onClick={onSignIn}>Sign in with Google</button>
    </div>
  );
}
