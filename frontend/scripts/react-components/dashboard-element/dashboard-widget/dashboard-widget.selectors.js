import { createSelector } from 'reselect';
import omit from 'lodash/omit';
import sortBy from 'lodash/sortBy';
import kebabCase from 'lodash/kebabCase';
import CHART_CONFIG from 'react-components/dashboard-element/dashboard-widget/dashboard-widget-config';

const parsedChartTypes = {
  bar_chart: 'bar',
  donut_chart: 'pie',
  stacked_bar_chart: 'stackedBar',
  dynamic_sentence: 'dynamicSentence',
  horizontal_bar_chart: 'horizontalBar',
  horizontal_stacked_bar_chart: 'horizontalStackedBarChart'
};

const getMeta = (state, { meta }) => meta || null;
const getData = (state, { data }) => data || null;
const getChartType = (state, { chartType }) => (chartType ? parsedChartTypes[chartType] : null);
const getSelectedRecolorBy = (state, props) => props.selectedRecolorBy;

export const getDefaultConfig = createSelector(
  [getChartType],
  chartType => CHART_CONFIG[chartType] || CHART_CONFIG.bar
);

const getGroupedAxis = (axis, meta) => {
  const toBeRemoved = axis === 'y' ? 'x' : 'y';
  const groupedAxis = omit(meta, ['xAxis', 'yAxis', toBeRemoved]);
  return groupedAxis;
};

const sortGroupedAxis = keys => sortBy(Object.keys(keys), key => parseInt(key.substr(1), 10));

export const getColors = createSelector(
  [getMeta, getData, getDefaultConfig, getChartType, getSelectedRecolorBy],
  (meta, data, defaultConfig, chartType, selectedRecolorBy) => {
    const { colors, layout } = defaultConfig;

    if (!meta || chartType === 'dynamicSentence') {
      return colors && colors.default;
    }

    const getColor = labelText => {
      const legendKey = labelText && kebabCase(labelText);
      const type = colors[selectedRecolorBy.legendType];
      const theme = type && type[selectedRecolorBy.legendColorTheme];
      return theme && theme[legendKey];
    };

    if (chartType !== 'pie') {
      const continuousAxis = layout === 'vertical' ? 'x' : 'y';
      const groupedAxis = getGroupedAxis(continuousAxis, meta);
      return sortGroupedAxis(groupedAxis).map((key, index) => {
        const label = groupedAxis[key].label || meta[`${continuousAxis}Axis`].label;
        const color = getColor(label);
        return {
          label,
          color: color || colors.default[index]
        };
      });
    }

    return data.map((item, index) => {
      const color = getColor(item.x);
      return {
        label: item.x,
        color: color || (colors && colors.default[index])
      };
    });
  }
);

export const getYKeys = createSelector(
  [getMeta, getDefaultConfig, getColors],
  (meta, defaultConfig, colors) => {
    const { yKeys, yKeysAttributes, layout } = defaultConfig;
    if (!meta || !yKeys || layout === 'vertical') return yKeys;
    const groupedY = getGroupedAxis('y', meta);
    return Object.keys(yKeys).reduce((yKeysTypesAcc, nextYKeyType) => {
      const yKeyTypeAttributes = yKeysAttributes && yKeysAttributes[nextYKeyType];
      return {
        ...yKeysTypesAcc,
        [nextYKeyType]: sortGroupedAxis(groupedY).reduce(
          (groupedYKeysAcc, nextGroupedYKey, index) => ({
            ...groupedYKeysAcc,
            [nextGroupedYKey]: {
              ...yKeyTypeAttributes,
              fill: colors && colors[index] && colors[index].color,
              stroke: colors && colors[index] && colors[index].color
            }
          }),
          {}
        )
      };
    }, {});
  }
);

export const getXKeys = createSelector(
  [getMeta, getDefaultConfig, getColors],
  (meta, defaultConfig, colors) => {
    const { xKeys, xKeysAttributes, layout } = defaultConfig;
    if (!meta || !xKeys || layout !== 'vertical') return xKeys;
    const groupedX = getGroupedAxis('x', meta);
    return Object.keys(xKeys).reduce((xKeysTypesAcc, nextXKeyType) => {
      const xKeyTypeAttributes = xKeysAttributes && xKeysAttributes[nextXKeyType];
      return {
        ...xKeysTypesAcc,
        [nextXKeyType]: sortGroupedAxis(groupedX).reduce(
          (groupedXKeysAcc, nextGroupedXKey, index) => ({
            ...groupedXKeysAcc,
            [nextGroupedXKey]: {
              ...xKeyTypeAttributes,
              fill: colors && colors[index] && colors[index].color,
              stroke: colors && colors[index] && colors[index].color
            }
          }),
          {}
        )
      };
    }, {});
  }
);

export const makeGetConfig = () =>
  createSelector(
    [getMeta, getYKeys, getXKeys, getColors, getDefaultConfig],
    (meta, yKeys, xKeys, colors, defaultConfig) => {
      if (!meta) return defaultConfig;
      const config = {
        ...defaultConfig,
        xAxis: defaultConfig.xAxis && {
          ...defaultConfig.xAxis,
          type: meta.xAxis && meta.xAxis.type
        },
        yAxis: defaultConfig.yAxis && {
          ...defaultConfig.yAxis,
          type: meta.yAxis && meta.yAxis.type
        },
        yAxisLabel: {
          text: meta.yAxis && meta.yAxis.label,
          suffix: meta.yAxis && meta.yAxis.suffix
        },
        tooltip: {
          ...defaultConfig.tooltip
        },
        yKeys,
        xKeys,
        colors
      };
      return config;
    }
  );
