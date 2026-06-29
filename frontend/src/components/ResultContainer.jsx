import React, { useState } from 'react'

const ResultContainer = ({ results }) => {
  if (!results) return null;
  const { areas, exclusion_breakdown } = results;

  const [opened, setOpened] = useState(true);

  if (!opened) {
    return (
      <button
        className='absolute bottom-0 z-1010 bg-white border rounded-xl px-2 py-1 m-2 hover:text-red-500'
        onClick={() => setOpened(true)}
      >
        Show Results
      </button>
    );
  }

  return (
    <div className="w-full md:w-1/3 p-4 space-y-4 bg-gray-50 border-r absolute bottom-0 z-1010">
      <div className='flex justify-between hover:text-green-500'>
        <h2 className="text-lg font-bold text-gray-800">Parcel Analysis</h2>
        <button className='font-bold' onClick={() => setOpened(false)}>X</button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-3">
        <StatCard title="Total Parcel" value={areas.total_parcel} />
        <StatCard title="Buildable Area" value={areas.buildable} />
        <StatCard title="Excluded Area" value={areas.excluded} />
      </div>

      {/* Breakdown */}
      <div className="bg-white shadow rounded-xl p-4 border">
        <h3 className="text-md font-semibold mb-2 text-gray-700">
          Exclusion Breakdown
        </h3>
        {exclusion_breakdown.map((item, idx) => (
          <BreakdownItem
            key={idx}
            label={item.type}
            value={item.area}
          />
        ))}
      </div>
    </div>
  );
}

const StatCard = ({ title, value }) => (
  <div className="bg-white shadow rounded-xl p-4 border">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-xl font-semibold text-gray-800">{value.toFixed(2)} acres</p>
  </div>
);

const BreakdownItem = ({ label, value }) => (
  <div className="flex justify-between text-sm py-1">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium text-gray-800">{value.toFixed(2)}</span>
  </div>
);

export default ResultContainer