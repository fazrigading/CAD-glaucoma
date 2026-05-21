interface CorrectionAdjustProps {
  gridline: boolean;
  gridlineSize: number;
  gridlineColor: string;
  gridlineOpacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  onChange: (newSettings: Partial<CorrectionAdjustProps>) => void;
}

const CorrectionAdjust = ({
  gridline,
  gridlineSize,
  gridlineColor,
  gridlineOpacity,
  brightness,
  contrast,
  saturation,
  onChange,
}: CorrectionAdjustProps) => {
  return (
    <div className="w-full">
      <div className="collapse collapse-arrow rounded-none">
        <input type="checkbox" />
        <div className="collapse-title bg-mainBlue text-white">Image Options</div>
        <div className="collapse-content">
          <div className="w-full flex justify-between py-2">
            <div className="w-1/4">
              <input
                type="checkbox"
                className="checkbox checkbox-xs bg-white me-2"
                checked={gridline}
                onChange={e => onChange({ gridline: e.target.checked })}
              />
              <label className="text-xs">Gridlines</label>
            </div>
            <div className="w-1/4">
              <label className={`text-xs ${!gridline ? 'opacity-30' : ''}`}>Density</label><br />
              <input
                type="number"
                min={1}
                max={10}
                value={gridlineSize}
                className="input input-xs w-2/3 bg-white"
                disabled={!gridline}
                onChange={e => onChange({ gridlineSize: Number(e.target.value) })}
              />
            </div>
            <div className="w-1/4">
              <label className={`text-xs ${!gridline ? 'opacity-30' : ''}`}>Color</label><br />
              <select
                className="select select-xs bg-white"
                disabled={!gridline}
                value={gridlineColor}
                onChange={e => onChange({ gridlineColor: e.target.value })}
              >
                <option value="white">White</option>
                <option value="black">Black</option>
                <option value="red">Red</option>
              </select>
            </div>
            <div className="w-1/4">
              <label className={`text-xs ${!gridline ? 'opacity-30' : ''}`}>Opacity</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.01}
                value={gridlineOpacity}
                className="w-full"
                disabled={!gridline}
                onChange={e => onChange({ gridlineOpacity: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="w-full flex">
            <div className="w-1/3">
              <p>Brightness</p>
              <p>Contrast</p>
              <p>Saturation</p>
            </div>
            <div className="w-2/3">
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.01}
                value={brightness}
                className="w-full"
                onChange={e => onChange({ brightness: Number(e.target.value) })}
              />
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.01}
                value={contrast}
                className="w-full"
                onChange={e => onChange({ contrast: Number(e.target.value) })}
              />
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={saturation}
                className="w-full"
                onChange={e => onChange({ saturation: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrectionAdjust;