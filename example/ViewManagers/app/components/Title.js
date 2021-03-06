import React from 'react';
import AutoBindComponent from 'react-autobind-component';

import {
    StyleSheet,
    View,
} from 'react-native';

import {
    Text,
} from '~/components';

export default class Title extends AutoBindComponent {
    render() {
        const { children, style: extraStyle } = this.props;
        const { style } = this;

        return (
            <View style={style.container}>
                <Text style={[style.title, extraStyle]}>
                    {children}
                </Text>
            </View>
        );
    }

    style = StyleSheet.create({
        container: {
            flexGrow: 1,
            zIndex: -1,
        },
        title: {
            color: '#fff',
            fontSize: 18,
            textAlign: 'center',
            zIndex: 0,
        },
    });
};
