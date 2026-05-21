interface ImgProps {
  src: string;
  size: number;
  alt: string;
  text: string;
}

const Img = ({ src, size, alt, text }: ImgProps) => {
  return (
    <div className="text-center">
      <img src={src} width={size} height={size} alt={alt} />
      <p className="text-paragraph font-light">{text}</p>
    </div>
  );
};

export default Img;
