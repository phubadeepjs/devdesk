import React, { useState, useEffect } from 'react';
import './TimestampConverter.css';

const TimestampConverter: React.FC = () => {
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(Date.now());
  const [timestampInput, setTimestampInput] = useState<string>('');
  const [timestampUnit, setTimestampUnit] = useState<'s' | 'ms' | 'us' | 'ns'>('s');
  const [convertedDates, setConvertedDates] = useState<any>(null);
  const [timestampError, setTimestampError] = useState<string>('');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [day, setDay] = useState<string>(String(new Date().getDate()).padStart(2, '0'));
  const [hour, setHour] = useState<string>(String(new Date().getHours()).padStart(2, '0'));
  const [minute, setMinute] = useState<string>(String(new Date().getMinutes()).padStart(2, '0'));
  const [second, setSecond] = useState<string>(String(new Date().getSeconds()).padStart(2, '0'));
  const [dateTimestamp, setDateTimestamp] = useState<number | null>(null);
  const [dateError, setDateError] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const normalizeTimestamp = (value: number, unit: string): number => {
    switch (unit) {
      case 's': return value * 1000;
      case 'ms': return value;
      case 'us': return value / 1000;
      case 'ns': return value / 1000000;
      default: return value;
    }
  };

  const formatDate = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const iso8601 = date.toISOString();
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const rfc822 = `${daysShort[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${monthsShort[date.getUTCMonth()]} ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} +0000`;
    const rfc2822 = date.toUTCString();
    const rfc3339 = iso8601;
    const humanReadable = `${pad(date.getUTCDate())}/${pad(date.getUTCMonth() + 1)}/${date.getUTCFullYear()} @ ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}pm`;

    return { humanReadable, iso8601, rfc822, rfc2822, rfc3339 };
  };

  const handleTimestampConvert = () => {
    setTimestampError('');
    const value = parseFloat(timestampInput);
    if (isNaN(value)) {
      setTimestampError('Please enter a valid timestamp');
      setConvertedDates(null);
      return;
    }

    const ms = normalizeTimestamp(value, timestampUnit);
    const date = new Date(ms);

    if (isNaN(date.getTime())) {
      setTimestampError('Invalid timestamp');
      setConvertedDates(null);
      return;
    }

    setConvertedDates(formatDate(date));
  };

  const handleDateConvert = () => {
    setDateError('');
    const y = parseInt(year);
    const m = parseInt(month);
    const d = parseInt(day);
    const h = parseInt(hour);
    const min = parseInt(minute);
    const s = parseInt(second);

    if (isNaN(y) || isNaN(m) || isNaN(d) || isNaN(h) || isNaN(min) || isNaN(s)) {
      setDateError('Please fill in all date fields');
      setDateTimestamp(null);
      return;
    }

    if (m < 1 || m > 12 || d < 1 || d > 31 || h < 0 || h > 23 || min < 0 || min > 59 || s < 0 || s > 59) {
      setDateError('Please enter valid date values');
      setDateTimestamp(null);
      return;
    }

    const dateObj = new Date(Date.UTC(y, m - 1, d, h, min, s));

    if (isNaN(dateObj.getTime())) {
      setDateError('Invalid date');
      setDateTimestamp(null);
      return;
    }

    setDateTimestamp(Math.floor(dateObj.getTime() / 1000));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const currentDate = new Date(currentTimestamp);
  const currentTimeStr = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(Math.abs(diff) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${diff < 0 ? 'from now' : 'ago'}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ${diff < 0 ? 'from now' : 'ago'}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ${diff < 0 ? 'from now' : 'ago'}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''} ${diff < 0 ? 'from now' : 'ago'}`;
  };

  return (
    <div className="timestamp-converter">
      <div className="tool-header">
        <h2>Timestamp Converter</h2>
        <p className="tool-description">Convert between Unix timestamps and human-readable dates</p>
      </div>

      <div className="section-grid">
        {/* Current Timestamp */}
        <div className="section-card current-timestamp">
          <h3 className="section-title">The Current Epoch Unix Timestamp</h3>
          <div className="timestamp-display">{Math.floor(currentTimestamp / 1000)}</div>
          <div className="timestamp-label">SECONDS SINCE JAN 01 1970. (UTC)</div>
          <div className="time-display">{currentTimeStr}</div>
          <button className="btn-copy" onClick={() => copyToClipboard(Math.floor(currentTimestamp / 1000).toString())}>
            Copy
          </button>
        </div>

        {/* Enter Timestamp */}
        <div className="section-card">
          <h3 className="section-title">Enter a Timestamp</h3>

          {timestampError && (
            <div className="error-message">
              <strong>Error:</strong> {timestampError}
            </div>
          )}

          <div className="input-group">
            <input
              type="text"
              className="input-field"
              value={timestampInput}
              onChange={(e) => setTimestampInput(e.target.value)}
              placeholder="1759853471"
            />
            <div className="help-text">
              Supports Unix timestamps in seconds, milliseconds, microseconds and nanoseconds.
            </div>
            <div className="radio-group">
              {(['s', 'ms', 'us', 'ns'] as const).map((unit) => (
                <label key={unit} className="radio-label">
                  <input
                    type="radio"
                    value={unit}
                    checked={timestampUnit === unit}
                    onChange={(e) => setTimestampUnit(e.target.value as any)}
                  />
                  <span>{unit === 's' ? 'Seconds' : unit === 'ms' ? 'Milliseconds' : unit === 'us' ? 'Microseconds' : 'Nanoseconds'}</span>
                </label>
              ))}
            </div>
            <button className="btn-convert" onClick={handleTimestampConvert}>
              Convert →
            </button>
          </div>
        </div>
      </div>

      {/* Conversion Result */}
      {convertedDates && (
        <div className="section-card">
          <div className="result-table">
            <table>
              <thead>
                <tr>
                  <th>Format</th>
                  <th>Converted Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Seconds</td>
                  <td>{timestampInput}</td>
                </tr>
                <tr>
                  <td>GMT</td>
                  <td>{convertedDates.rfc2822}</td>
                </tr>
                <tr>
                  <td>Your Time Zone</td>
                  <td>{new Date(normalizeTimestamp(parseFloat(timestampInput), timestampUnit)).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Relative</td>
                  <td>{getRelativeTime(normalizeTimestamp(parseFloat(timestampInput), timestampUnit))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Date to Timestamp */}
      <div className="section-card">
        <h3 className="section-title">Enter a Date & Time</h3>

        {dateError && (
          <div className="error-message">
            <strong>Error:</strong> {dateError}
          </div>
        )}

        <div className="date-inputs">
          <div className="date-input-wrapper">
            <label className="date-label">Year</label>
            <input type="number" className="date-input" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025" />
          </div>
          <div className="date-input-wrapper">
            <label className="date-label">Month</label>
            <input type="number" className="date-input" min="1" max="12" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="10" />
          </div>
          <div className="date-input-wrapper">
            <label className="date-label">Day</label>
            <input type="number" className="date-input" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)} placeholder="07" />
          </div>
          <div className="date-input-wrapper">
            <label className="date-label">Hour (24h)</label>
            <input type="number" className="date-input" min="0" max="23" value={hour} onChange={(e) => setHour(e.target.value)} placeholder="16" />
          </div>
          <div className="date-input-wrapper">
            <label className="date-label">Minutes</label>
            <input type="number" className="date-input" min="0" max="59" value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="30" />
          </div>
          <div className="date-input-wrapper">
            <label className="date-label">Seconds</label>
            <input type="number" className="date-input" min="0" max="59" value={second} onChange={(e) => setSecond(e.target.value)} placeholder="00" />
          </div>
        </div>

        <button className="btn-convert" onClick={handleDateConvert}>
          Convert →
        </button>

        {dateTimestamp !== null && (
          <div className="timestamp-result">
            <div className="timestamp-result-value">{dateTimestamp}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimestampConverter;
