import * as React from 'react';
import * as lodash from 'lodash';
import { IContentHandler, IDevice } from '../../../types';
import { Configuration, DeviceDto } from '../../../api2';
import { Socket } from '../../../socket';
import { PropertiesComponent } from '../../../components/Properties';
import { DeviceService } from '../../../services/DeviceService';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { DetailsList, Selection, IGroup, SelectionMode, CollapseAllVisibility, CheckboxVisibility } from 'office-ui-fabric-react/lib/DetailsList';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import {
    IDragDropEvents,
    IDragDropContext
} from 'office-ui-fabric-react/lib/utilities/dragdrop/interfaces';

import './index.scss';
import * as mousetrap from 'mousetrap';
import { MouseTrap } from '../../../components/MouseTrap';
import { HTMLFile } from '../html/HTMLFile';
import { Metadata } from '../metadata';
import { RESOURCE_VARIABLES } from '../../../config';
import { EditorContext } from '../../EditorContext';
import { Frame } from '../VisualEditor/Frame';
import { Meta } from 'antd/lib/list/Item';
import * as utils from '../../../shared/utils';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
