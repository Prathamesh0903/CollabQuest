import React from 'react';

type Props = {
  startTime: string | number | Date;
  endTime: string | number | Date;
  onElapsed?: () => void;
};

export const ContestTimer: React.FC<Props> = ({ startTime, endTime, onElapsed }) => {
  const [now, setNow] = React.useState<number>(Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const isBefore = now < start;
  const isLive = now >= start && now <= end;
  const target = isBefore ? start : end;
  const diff = Math.max(0, target - now);

  React.useEffect(() => {
    if (!isLive && now > end && onElapsed) onElapsed();
  }, [isLive, now, end, onElapsed]);

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const label = isBefore ? 'Starts in' : isLive ? 'Ends in' : 'Ended';
  const time = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <span className="cq-timer">
      {label}{isLive || isBefore ? ` ${time}` : ''}
    </span>
  );
};

export default ContestTimer;


