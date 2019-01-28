/* eslint-disable no-shadow */
import connect from 'connect';
import ToolContent from 'components/tool/tool-content.component';
import { resetSankey } from 'react-components/tool/tool.actions';

const mapMethodsToState = state => ({
  toggleMapVisibility: state.tool.isMapVisible,
  toggleMapLayersVisibility: state.tool.isMapLayerVisible,
  showLoader: state.tool.links !== null && (state.tool.flowsLoading || state.tool.mapLoading),
  toggleError: state.tool.links === null && !state.tool.flowsLoading
});

const mapViewCallbacksToActions = () => ({
  resetSankey: () => resetSankey()
});

export default connect(
  ToolContent,
  mapMethodsToState,
  mapViewCallbacksToActions
);
