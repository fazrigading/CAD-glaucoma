import Footers from "../components/general/footer";
import Navbar from "../components/general/navbar";
import UseModel from "../components/model/useModel";
import Logo from "../components/overview/logo";

function Model() {
  return (
    <>
      {/* header */}
      <div className="w-full py-5">
          <div className="flex justify-center ps-12 py-2 gap-3">
            <Logo imgWidth={80} imgHeight={80}/>
          </div>
          <h1 className="text-center text-4xl mb-4">SISTEM COMPUTER- AIDED DETECTION (CAD)</h1>
          <Navbar />
      </div>

      {/* Input Section */}
      <div className="w-full py-5 bg-slate-200">
        <UseModel />
      </div>

      {/* footers */}
      <Footers />
    </>
  );
}

export default Model;   