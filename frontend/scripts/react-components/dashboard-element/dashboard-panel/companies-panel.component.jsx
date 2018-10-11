import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SearchInput from 'react-components/shared/search-input/search-input.component';
import GridList from 'react-components/shared/grid-list.component';
import GridListItem from 'react-components/shared/grid-list-item.component';
import Tabs from 'react-components/shared/tabs.component';

class CompaniesPanel extends Component {
  componentDidMount() {
    this.props.onSelectNodeTypeTab(this.props.tabs[0]);
  }

  componentDidUpdate(prevProps) {
    const { activeCompanyId, getCompaniesData, activeNodeTypeTabId } = this.props;

    const shouldGetData = [
      prevProps.activeNodeTypeTabId !== activeNodeTypeTabId,
      prevProps.activeCompanyId !== activeCompanyId
    ];
    if (shouldGetData.includes(true)) {
      getCompaniesData();
    }
  }

  render() {
    const {
      tabs,
      searchCompanies,
      companies,
      onSelectNodeTypeTab,
      onSelectCompany,
      activeNodeTypeTabId,
      activeCompanyId
    } = this.props;
    return (
      <React.Fragment>
        <SearchInput
          className="dashboard-panel-search"
          items={searchCompanies}
          placeholder="Search place"
          onSelect={i => i}
        />
        <Tabs
          tabs={tabs}
          onSelectTab={onSelectNodeTypeTab}
          selectedTab={activeNodeTypeTabId}
          itemTabRenderer={i => i.name}
          getTabId={item => item.id}
        >
          {activeNodeTypeTabId && (
            <GridList
              items={companies}
              height={companies.length > 5 ? 200 : 50}
              width={950}
              rowHeight={50}
              columnWidth={190}
              columnCount={5}
            >
              {itemProps => (
                <GridListItem
                  {...itemProps}
                  isActive={activeCompanyId === (itemProps.item && itemProps.item.id)}
                  enableItem={onSelectCompany}
                  disableItem={() => onSelectCompany(null)}
                />
              )}
            </GridList>
          )}
        </Tabs>
      </React.Fragment>
    );
  }
}

CompaniesPanel.propTypes = {
  tabs: PropTypes.array.isRequired,
  activeCompanyId: PropTypes.string,
  companies: PropTypes.array.isRequired,
  getCompaniesData: PropTypes.func.isRequired,
  searchCompanies: PropTypes.array.isRequired,
  onSelectNodeTypeTab: PropTypes.func.isRequired,
  onSelectCompany: PropTypes.func.isRequired,
  activeNodeTypeTabId: PropTypes.string.isRequired
};

export default CompaniesPanel;