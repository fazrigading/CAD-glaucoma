import Img from '../general/img';

export default function ImgContent() {
  const imgSize = 200;
  return (
    <div className="flex flex-row justify-center gap-12">
      <div className="flex flex-col justify-center gap-3">
        <h3 className="text-lg text-center font-medium">Glaukoma</h3>
        <Img
          src="/content/glaucoma_fundus.jpg"
          size={imgSize}
          alt="Citra fundus asli"
          text="Gambar Fundus"
        />
        <Img
          src="/content/glaucoma_anot.png"
          size={imgSize}
          alt="Gambar fundus dengan notasi disc dan cup"
          text="Anotasi disc dan cup"
        />
        <Img
          src="/content/glaucoma_mask.png"
          size={imgSize}
          alt="Gambar mask"
          text="Mask"
        />
      </div>
      
      <div className="flex flex-col justify-center gap-3">
        <h3 className="text-lg text-center font-medium">
          Non-Glaukoma
        </h3>
        <Img
          src="/content/nonGlaucoma_fundus.jpg"
          size={imgSize}
          alt="Citra fundus asli"
          text="Gambar Fundus"
        />
        <Img
          src="/content/nonGlaucoma_anot.png"
          size={imgSize}
          alt="Gambar fundus dengan notasi disc dan cup"
          text="Anotasi disc dan cup"
        />
        <Img
          src="/content/nonGlaucoma_mask.png"
          size={imgSize}
          alt="Gambar mask"
          text="Mask"
        />
      </div>
    </div>
  );
}