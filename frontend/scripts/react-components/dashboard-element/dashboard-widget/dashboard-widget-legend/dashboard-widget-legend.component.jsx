import React from 'react';
import PropTypes from 'prop-types';

import 'react-components/dashboard-element/dashboard-widget/dashboard-widget-legend/dashboard-widget-legend.scss';

function DashboardWidgetLegend(props) {
  const { colors } = props;
  if (colors.length < 2) return null;
  return (
    <div className="c-dashboard-widget-legend">
      {colors.map((d, i) => (
        <div key={i} className="column small-4">
          <div className="dashboard-widget-key-item">
            <span
              className="dashboard-widget-color-span"
              style={{ backgroundColor: d.color || 'white' }}
            />
            <p>{d.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

DashboardWidgetLegend.propTypes = {
  colors: PropTypes.array.isRequired
};

export default DashboardWidgetLegend;
