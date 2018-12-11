import BaseMarkup from 'html/base.ejs';
import FeedbackMarkup from 'html/includes/_feedback.ejs';

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { Provider } from 'react-redux';

import DashboardElement from 'react-components/dashboard-element/dashboard-element.container';
import TopNav from 'react-components/nav/top-nav/top-nav.container';
import Footer from 'react-components/shared/footer/footer.component';
import reducerRegistry from 'scripts/reducer-registry';

import 'styles/layouts/l-dashboard-element.scss';
import reducer from 'react-components/dashboard-element/dashboard-element.reducer';
import widgetsReducer from 'react-components/widgets/widgets.reducer';

reducerRegistry.register('dashboardElement', reducer);
reducerRegistry.register('widgets', widgetsReducer);

export const mount = (root, store) => {
  root.innerHTML = BaseMarkup({
    feedback: FeedbackMarkup()
  });

  render(
    <Provider store={store}>
      <TopNav />
    </Provider>,
    document.getElementById('nav')
  );

  render(
    <Provider store={store}>
      <DashboardElement />
    </Provider>,
    document.getElementById('page-react-root')
  );

  render(
    <Provider store={store}>
      <Footer />
    </Provider>,
    document.getElementById('footer')
  );
};

export const unmount = () => {
  unmountComponentAtNode(document.getElementById('page-react-root'));
  unmountComponentAtNode(document.getElementById('nav'));
  unmountComponentAtNode(document.getElementById('footer'));
};
