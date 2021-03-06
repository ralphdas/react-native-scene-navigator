import React, { cloneElement, Children } from 'react';
import AutoBindComponent from 'react-autobind-component';
import { find } from 'lodash';
import {
    Navigator as ReactNativeNavigator,
    BackAndroid,
    Platform,
} from 'react-native';

import DeferredView from './DeferredView';
import Scene from './Scene';

// navigatorConfig.init should be called in the constructor of the navigator component
const navigatorConfig = Platform.select({
    ios: () => {
        return {
            init: (instance) => {
            },
            destroy: (instance) => {
            },
        };
    },
    android: () => {
        return {
            init: (instance) => {
                BackAndroid.addEventListener('hardwareBackPress', instance._handleBackPressAndroid);
            },
            destroy: (instance) => {
                BackAndroid.removeEventListener('hardwareBackPress', instance._handleBackPressAndroid);
            },
        };
    },
})();

export default class Navigator extends AutoBindComponent {

    state = {
        navbars: {},
    };

    // init
    constructor(props) {
        super(props);

        this._sceneStack = Children.map(props.children, (child, index) => {
            if (child.type !== Scene) throw new Error(`Expected 'Scene' but instead got '${child.type.displayName}'. Please use Navigator component Scene for scene declarations.`);
            return {
                component: child,
                reference: child.props.reference,
                transition: child.props.transition,
            };
        });
        // make rootview accessible to this component
        this._rootScene = this._sceneStack[0];
        navigatorConfig.init(this);
    }

    // destroy any references on umount
    componentWillUnmount() {
        navigatorConfig.destroy(this);
    }

    attachNavigationBar(sceneReference, navbarComponent) {
        this.setState(({navbars}) => {
            navbars[sceneReference] = navbarComponent;
            return { navbars };
        });
    }

    // navigator.open(reference) opens the coresponging route
    open(reference, params) {
        const route = find(this._sceneStack, {reference});
        this.refs.navigator.push({params, ...route});
    }

    // navigator.back goes back one view
    back() {
        this.refs.navigator.pop();
    }

    onTransitionComplete(event) {
        const { onTransitionComplete } = this.props;
        if (onTransitionComplete) onTransitionComplete(event);
    }

    // private:
    // back button press handler for android
    // goed back one view, if its at the root, it minimizes the app
    _handleBackPressAndroid() {
        if (this._getLastRoute() === this._rootScene) return false;
        this.refs.navigator.pop();
        return true;
    }

    // private:
    // gets all active routes
    _getAllActiveRoutes() {
        return this.refs.navigator.getCurrentRoutes();
    }

    // private:
    // get last route
    _getLastRoute() {
        const activeRoutes = this._getAllActiveRoutes();
        return activeRoutes[activeRoutes.length - 1];
    }

    render() {
        const { navbars } = this.state;
        return (
            <ReactNativeNavigator
                style={{flex: 1, backgroundColor: '#000'}}
                ref='navigator'
                initialRoute={this._rootScene}
                configureScene={({transition}) => transition}
                onDidFocus={this.onTransitionComplete}
                // sceneStyle={{overflow: 'visible'}}
                renderScene={({component, ...scene}, navigator) => {
                    return (
                        <DeferredView>
                            { navbars[scene.reference] }
                            { cloneElement(component, {
                                scene,
                                navigator: {
                                    open: this.open,
                                    back: this.back,
                                    attachNavigationBar: this.attachNavigationBar,
                                },
                            }) }
                        </DeferredView>
                    );
                }}
            />
        );
    }

    static transitions = {
        standard: Platform.select({
            ios: () => ReactNativeNavigator.SceneConfigs.PushFromRight,
            android: () => ReactNativeNavigator.SceneConfigs.FloatFromBottomAndroid,
        })(),
        modal: Platform.select({
            ios: () => ReactNativeNavigator.SceneConfigs.FloatFromBottom,
            android: () => ReactNativeNavigator.SceneConfigs.FloatFromBottom,
        })(),
        ...ReactNativeNavigator.SceneConfigs,
    };
};
