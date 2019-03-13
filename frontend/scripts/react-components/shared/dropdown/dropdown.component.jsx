import React from 'react';
import PropTypes from 'prop-types';
import Downshift from 'downshift';
import cx from 'classnames';
import './dropdown.scss';

class Dropdown extends React.Component {
  renderItem(item, index, getItemProps) {
    const { theme, readOnly } = this.props;
    return (
      <li
        {...getItemProps({
          item,
          index,
          key: item.value,
          disabled: readOnly
        })}
        className={cx('dropdown-menu-item', { '-with-icon': item.icon })}
      >
        {item.icon && (
          <svg className={cx('icon', `icon-${item.icon}`, { [theme.icon]: theme.icon })}>
            <use xlinkHref={`#icon-${item.icon}`} />
          </svg>
        )}
        <span title={item.label} className="item-label">
          {item.label}
        </span>
      </li>
    );
  }

  getSelectedOptions(selectedItem) {
    const { readOnly, showSelected, options, value } = this.props;

    return readOnly || showSelected
      ? options
      : options.filter(
          o => o.value !== (selectedItem && selectedItem.value) && o.value !== value.value
        );
  }

  render() {
    const {
      options,
      value,
      onChange,
      arrowType,
      selectedValueOverride,
      theme,
      position,
      itemToString,
      color,
      variant,
      readOnly
    } = this.props;

    return (
      <Downshift defaultSelectedItem={value} itemToString={itemToString} onChange={onChange}>
        {({
          getItemProps,
          isOpen,
          toggleMenu,
          getToggleButtonProps,
          selectedItem,
          inputValue,
          getMenuProps
        }) => (
          <div
            className={cx('c-dropdown-component', {
              '-open': isOpen,
              [`v-${variant}`]: variant,
              [`color-${color}`]: color,
              '-read-only': readOnly
            })}
          >
            <button
              {...getToggleButtonProps()}
              className={cx(
                'dropdown-selected-item',
                { [`-${arrowType}`]: arrowType },
                theme['selected-item']
              )}
              onClick={toggleMenu}
            >
              {selectedValueOverride || inputValue}
            </button>
            {isOpen && options.length > 0 ? (
              <ul
                {...getMenuProps()}
                className={cx('dropdown-menu', {
                  [theme.menu]: theme.menu,
                  [`-position-${position}`]: position
                })}
              >
                {this.getSelectedOptions(selectedItem).map((item, index) =>
                  this.renderItem(item, index, getItemProps)
                )}
              </ul>
            ) : null}
          </div>
        )}
      </Downshift>
    );
  }
}

Dropdown.propTypes = {
  options: PropTypes.array,
  value: PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    icon: PropTypes.string
  }),
  onChange: PropTypes.func,
  arrowType: PropTypes.string,
  selectedValueOverride: PropTypes.string,
  showSelected: PropTypes.bool,
  readOnly: PropTypes.bool,
  theme: PropTypes.object,
  position: PropTypes.string,
  itemToString: PropTypes.func,
  variant: PropTypes.string,
  color: PropTypes.string
};

Dropdown.defaultProps = {
  options: [],
  showSelected: false,
  readOnly: false,
  theme: {},
  itemToString: i => i && i.label
};

export default Dropdown;