interface NewPlantProgressProps {
  step: number;
  dark?: boolean;
}

export default function NewPlantProgress({ step, dark = false }: NewPlantProgressProps) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-[11px] font-medium mb-1.5 ${dark ? 'text-[#a3c7af]' : 'text-green-800'}`}>
        Paso {step} de 4
      </span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className={`h-1 w-8 rounded-full ${item <= step ? (dark ? 'bg-white' : 'bg-[#2e5c3a]') : (dark ? 'bg-white/30' : 'bg-gray-200')}`}
          />
        ))}
      </div>
    </div>
  );
}
