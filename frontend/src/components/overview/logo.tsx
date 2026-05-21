export default function Logo(props:{imgWidth:number; imgHeight:number;}){
    return (
        <>
            {/* Logo Kemendikbud */}
            <img
            className="z-1"
            src="/logo/kemendikbud.png"
            width={props.imgWidth}
            height={props.imgHeight}
            alt="Kemendikbud"
          />

          {/* Logo Unmul */}
          <img
            className="z-1"
            src="/logo/Unmul.png"
            width={props.imgWidth}
            height={props.imgHeight}
            alt="Unmul"
          />

          {/* Logo Dikti */}
          <img
            className="z-1"
            src="/logo/Diktisaintek.png"
            width={props.imgWidth}
            height={props.imgHeight}
            alt="DiktiSaintek"
          />
          
          {/* Logo SMEC */}
          <img
            className="z-1"
            src="/logo/SMEC.png"
            width={props.imgWidth + 56}
            height={props.imgHeight}
            alt="SMEC"
          />
        </>
    )
}