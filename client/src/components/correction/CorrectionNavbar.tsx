import Navbar from '../general/navbar';
import Logo from '../overview/logo';

const CorrectionNavbar = () => (
  <div className="w-full flex">
    {/* Header */}
    <div className="w-full flex gap-10">
      <div className="flex justify-center ps-10 py-2 gap-5">
        <Logo imgWidth={60} imgHeight={60} />
      </div>
      <div>
        <h1 className="text-center text-subheading font-bold">SISTEM COMPUTER- AIDED DETECTION (CAD)</h1>
        <Navbar />
      </div>
    </div>
  </div>
);

export default CorrectionNavbar; 