import data from "../../assets/content/overview.json";
import ImgContent from "./imgContent";

const Content = () => {

    return (
        <div className="w-2/3 py-15 m-auto text-center" >
            {Object.values(data).map((item, index) => (
                <div key={index} className="mb-5" >
                    <h1 className="text-heading pb-10" >{item.title}</h1>
                    <p className="text-paragraph text-justify font-normal">
                        {item.contents}
                    </p >
                    {index === 1 && <ImgContent/>}
                </div>
            ))}
        </div>
    );
};

export default Content;