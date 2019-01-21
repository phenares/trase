import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Link from 'redux-first-router-link';
import WorldMap from 'react-components/shared/world-map/world-map.container';
import Top from 'react-components/explore/top/top.component';
import Dropdown from 'react-components/shared/dropdown.component';
import formatValue from 'utils/formatValue';
import { EXPLORE_COLUMN_LIST } from 'constants';
import SentenceSelector from 'react-components/shared/sentence-selector/sentence-selector.container';
import Button from 'react-components/shared/button/button.component';
import Heading from 'react-components/shared/heading/heading.component';
import Text from 'react-components/shared/text/text.component';

import 'scripts/react-components/explore/explore.scss';

class Explore extends React.PureComponent {
  static propTypes = {
    loading: PropTypes.bool,
    topNodesKey: PropTypes.string,
    redirectQuery: PropTypes.object,
    selectedContext: PropTypes.object,
    topExporters: PropTypes.array.isRequired,
    getTableElements: PropTypes.func.isRequired,
    selectedYears: PropTypes.arrayOf(PropTypes.number),
    selectedTableColumnType: PropTypes.string.isRequired,
    setSelectedTableColumnType: PropTypes.func.isRequired
  };

  static getCallToAction(query) {
    if (query && query.isMapVisible && JSON.parse(query.isMapVisible)) {
      return 'Explore the map';
    }
    return 'Explore the supply chain';
  }

  units = [
    {
      name: '%',
      format: item => formatValue(item.height * 100, 'percentage')
    },
    {
      name: 't',
      format: item => formatValue(item.value, 'tons')
    }
  ];

  state = {
    selectedTableUnit: this.units[0]
  };

  componentDidMount() {
    const { topNodesKey, selectedTableColumnType } = this.props;
    if (topNodesKey) this.props.getTableElements(selectedTableColumnType);
  }

  componentDidUpdate(prevProps) {
    const { topNodesKey, selectedTableColumnType } = this.props;
    if (topNodesKey && prevProps.topNodesKey !== topNodesKey) {
      this.props.getTableElements(selectedTableColumnType);
    }
  }

  handleTableColumnChange = column => {
    this.props.setSelectedTableColumnType(column.type);
  };

  handleTableUnitChange = unitName => {
    this.setState({
      selectedTableUnit: this.units.find(u => u.name === unitName)
    });
  };

  handleFallbackClick = () => {
    const { selectedTableColumnType } = this.props;
    const [column] = EXPLORE_COLUMN_LIST.filter(item => item.type !== selectedTableColumnType);
    this.handleTableColumnChange(column);
  };

  renderTableColumnDropdown() {
    const { selectedTableColumnType } = this.props;
    const column = EXPLORE_COLUMN_LIST.find(item => item.type === selectedTableColumnType);

    return (
      <Dropdown
        className="-uppercase-title"
        value={column}
        valueList={EXPLORE_COLUMN_LIST}
        valueRenderer={v => v.label}
        onValueSelected={this.handleTableColumnChange}
      />
    );
  }

  renderTableUnitDropdown() {
    const { selectedTableUnit } = this.state;

    return (
      <Dropdown
        className="table-unit-dropdown"
        value={selectedTableUnit.name}
        valueList={this.units.map(i => i.name)}
        onValueSelected={this.handleTableUnitChange}
      />
    );
  }

  renderTableFallback() {
    const { selectedTableColumnType } = this.props;
    const column = EXPLORE_COLUMN_LIST.find(item => item.type === selectedTableColumnType);
    const [alternativeColumn] = EXPLORE_COLUMN_LIST.filter(
      item => item.type !== selectedTableColumnType
    );
    return (
      <div className="explore-table-fallback">
        <p className="explore-table-fallback-text">
          100% of {column.fallbackText} are unknown, explore{' '}
        </p>
        <button
          type="button"
          onClick={this.handleFallbackClick}
          className="explore-table-fallback-button"
        >
          {alternativeColumn.label.toLowerCase()}.
        </button>
      </div>
    );
  }

  render() {
    const {
      loading,
      topExporters,
      selectedYears,
      selectedContext,
      redirectQuery,
      selectedTableColumnType
    } = this.props;
    const { selectedTableUnit } = this.state;

    let link = null;
    if (selectedContext && selectedContext.id === 1) {
      const selectedTable = EXPLORE_COLUMN_LIST.find(i => i.type === selectedTableColumnType);
      link = typeof selectedTable !== 'undefined' ? selectedTable.link : null;
    }

    return (
      <div className="l-explore">
        <div className="c-explore">
          <div className="row column">
            <SentenceSelector />
          </div>
          <div className="row">
            <div className={cx('column', 'medium-7')}>
              <div className="explore-section">
                <div className="explore-map-wrapper">
                  <Heading variant="mono" size="sm" weight="bold">
                    Top Destinations
                  </Heading>
                  <div className="explore-map-container">
                    <WorldMap className="explore-world-map" />
                  </div>
                </div>
              </div>
            </div>
            <div className="column small-12 medium-5">
              <div className="explore-section -right">
                <div className="explore-table-container">
                  <div className="explore-table-header">
                    {this.renderTableColumnDropdown()}
                    {this.renderTableUnitDropdown()}
                  </div>
                  <Top
                    unit={selectedTableUnit}
                    targetLink={link}
                    year={selectedYears[0]}
                    data={topExporters}
                    loading={!!loading}
                  />
                  {!loading && topExporters.length === 0 && this.renderTableFallback()}
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="column small-12 medium-7 small-order-2 medium-order-1">
              <p className="explore-footer-text">
                By accessing the Trase platform you have acknowledged and agreed to our{' '}
                <Link to={{ type: 'about', payload: { section: 'termsOfUse' } }}>
                  Terms of Use.
                </Link>
              </p>
            </div>
            <div className="column small-12 medium-5 small-order-1 medium-order-2 explore-footer-button-container">
              <div className="explore-footer-fake-button">
                <Text as="span" variant="mono">
                  Visit trase on a computer to explore the full supply chain
                </Text>
              </div>
              <Button
                as={Link}
                color="pink"
                size="lg"
                className="explore-link-to-tool"
                to={{ type: 'tool', payload: redirectQuery && { query: { state: redirectQuery } } }}
              >
                {Explore.getCallToAction(redirectQuery)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Explore;
