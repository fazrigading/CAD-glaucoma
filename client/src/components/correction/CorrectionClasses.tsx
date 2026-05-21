interface CorrectionClassesProps {
  classes: string;
  isVisible: boolean;
  nomor: number;
  changeVisibility: () => void;
  onDelete: () => void;
  onChangeLabel: (newLabel: string) => void;
}

const CorrectionClasses = (props: CorrectionClassesProps) => {
  let classed = props.classes;
  let bgClass;
  if (classed === 'disc') {
    bgClass = 'bg-lightRed';
  } else {
    bgClass = 'bg-lightCup';
  }
  return (
    <div className={`w-full py-2 flex justify-evenly items-center ${bgClass}`}>
      <p>{props.nomor}</p>
      <select
        className="select select-sm bg-white w-1/4"
        value={props.classes}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => props.onChangeLabel(e.target.value)}
      >
        <option value="disc">disc</option>
        <option value="cup">cup</option>
      </select>
      <button className="hover:text-white"><span className="material-symbols-outlined">edit</span></button>
      <button className="hover:text-white"><span className="material-symbols-outlined" onClick={props.changeVisibility}>{props.isVisible ? 'visibility' : 'visibility_off'}</span></button>
      <button className="hover:text-white" onClick={props.onDelete}><span className="material-symbols-outlined">close</span></button>
    </div>
  );
};

export default CorrectionClasses; 