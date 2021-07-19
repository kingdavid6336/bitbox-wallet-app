/**
 * Copyright 2018 Shift Devices AG
 * Copyright 2021 Shift Crypto AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, h, RenderableProps } from 'preact';
import * as accountApi from '../../../api/account';
import { Input, Select } from '../../../components/forms';
import { load } from '../../../decorators/load';
import { translate, TranslateProps } from '../../../decorators/translate';
import { getCoinCode, isBitcoinBased } from '../utils';
import * as style from './feetargets.css';

interface LoadedProps {
    config: any;
}

interface FeeTargetsProps {
    accountCode: string;
    coinCode: accountApi.CoinCode;
    disabled: boolean;
    fiatUnit: accountApi.Fiat;
    proposedFee?: accountApi.IAmount;
    feePerByte: string;
    showCalculatingFeeLabel?: boolean;
    onFeeTargetChange: (code: accountApi.FeeTargetCode) => void;
    onFeePerByte: (feePerByte: string) => void;
    error?: string;
}

export type Props = LoadedProps & FeeTargetsProps & TranslateProps;

interface Options {
    value: accountApi.FeeTargetCode;
    text: string;
}

interface State {
    feeTarget?: string | null;
    options: Options[] | null;
}

class FeeTargets extends Component<Props, State> {
    public readonly state: State = {
        feeTarget: null,
        options: null,
    };

    public componentDidMount() {
        this.updateFeeTargets(this.props.accountCode);
    }

    public componentWillReceiveProps({ accountCode }) {
        if (this.props.accountCode !== accountCode) {
            this.updateFeeTargets(accountCode);
        }
    }

    private updateFeeTargets = (accountCode: string) => {
        accountApi.getFeeTargetList(accountCode)
            .then(({ feeTargets, defaultFeeTarget }) => {
                const expert = this.props.config.frontend.expertFee;
                const options = feeTargets.map(({ code, feeRateInfo }) => ({
                    value: code,
                    text: this.props.t(`send.feeTarget.label.${code}`) + (expert && feeRateInfo ? ` (${feeRateInfo})` : ''),
                }));
                if (expert && isBitcoinBased(this.props.coinCode)) {
                    options.push({
                        value: 'custom',
                        text: this.props.t('send.feeTarget.label.custom'),
                    });
                }
                this.setState({ options });
                this.setFeeTarget(defaultFeeTarget);
            })
            .catch(console.error);
    }

    private handleFeeTargetChange = (event: Event) => {
        const target = event.target as HTMLSelectElement;
        this.setFeeTarget(target.options[target.selectedIndex].value as accountApi.FeeTargetCode);
    }

    private handleFeePerByte = (event: Event) => {
        const target = event.target as HTMLInputElement;
        this.props.onFeePerByte(target.value);
    }

    private setFeeTarget = (feeTarget: accountApi.FeeTargetCode) => {
        this.setState({ feeTarget });
        this.props.onFeeTargetChange(feeTarget);
    }

    private getProposeFeeText = (): string => {
        if (!this.props.proposedFee) {
            return '';
        }
        const { amount, unit, conversions } = this.props.proposedFee;
        const fiatUnit = this.props.fiatUnit;
        return `${amount} ${unit} ${conversions ? ` = ${conversions[fiatUnit]} ${fiatUnit}` : ''}`;
    }

    public render(
    {
        t,
        coinCode,
        disabled,
        error,
        showCalculatingFeeLabel = false,
        feePerByte,
    }: RenderableProps<Props>,
    {
        feeTarget,
        options,
    }: State) {
        if (options === null) {
            return (
                <Input
                    label={t('send.priority')}
                    id="feetarget"
                    placeholder={t('send.feeTarget.placeholder')}
                    disabled
                    transparent />
            );
        }
        const isCustom = feeTarget === 'custom';
        const hasOptions = options.length > 0;
        const proposeFeeText = this.getProposeFeeText();
        const preventFocus = document.activeElement && document.activeElement.nodeName === 'INPUT';
        return (
            hasOptions ? (
                <div>
                    {!isCustom ? (
                        showCalculatingFeeLabel ? (
                            <Input
                                disabled
                                label={t('send.priority')}
                                placeholder={t('send.feeTarget.placeholder')}
                                transparent />
                        ) : (
                            <Select
                                className={style.priority}
                                label={t('send.priority')}
                                id="feeTarget"
                                disabled={disabled}
                                onChange={this.handleFeeTargetChange}
                                selected={feeTarget}
                                value={feeTarget}
                                options={options} />
                        )
                    ) : (
                        <div className={style.rowCustomFee}>
                            <div className={style.column}>
                                <Select
                                    className={style.priority}
                                    label={t('send.priority')}
                                    id="feeTarget"
                                    disabled={disabled}
                                    onChange={this.handleFeeTargetChange}
                                    selected={feeTarget}
                                    value={feeTarget}
                                    options={options} />
                            </div>
                            <div className={style.column}>
                                <Input
                                    type={disabled ? 'text' : 'number'}
                                    min="0"
                                    step="any"
                                    autoFocus={!preventFocus}
                                    align="right"
                                    className={`${style.fee} ${style.feeCustom}`}
                                    disabled={disabled}
                                    label={t('send.fee.label')}
                                    id="proposedFee"
                                    placeholder={t('send.fee.customPlaceholder')}
                                    error={error}
                                    transparent
                                    onInput={this.handleFeePerByte}
                                    getRef={input => {
                                        setTimeout(() => {
                                            if (!disabled && input && input.autofocus) {
                                                input.focus();
                                            }
                                        });
                                    }}
                                    value={feePerByte}
                                >
                                    <span className={style.customFeeUnit}>sat/vB</span>
                                </Input>
                            </div>
                        </div>
                    )}
                    { feeTarget && (
                        <div>
                            {(showCalculatingFeeLabel || proposeFeeText ? (
                                <p class={style.feeProposed}>
                                    {t('send.fee.label')}:
                                    {' '}
                                    {showCalculatingFeeLabel ? t('send.feeTarget.placeholder') : proposeFeeText}
                                </p>
                            ) : null)}
                            { !isCustom ? (
                                <p class={style.feeDescription}>
                                    {t('send.feeTarget.estimate')}
                                    {' '}
                                    {t(`send.feeTarget.description.${feeTarget}`, {
                                        context: getCoinCode(coinCode) || '',
                                    })}
                                </p>
                            ) : null }
                        </div>
                    )}
                </div>
            ) : (
                <Input
                    disabled
                    label={t('send.fee.label')}
                    id="proposedFee"
                    placeholder={t('send.fee.placeholder')}
                    error={error}
                    transparent
                    value={proposeFeeText}
                />
            )
        );
    }
}

const loadedHOC = load<LoadedProps, FeeTargetsProps & TranslateProps>(
    { config: 'config' },
)(FeeTargets);
const TranslatedFeeTargets = translate<FeeTargetsProps>()(loadedHOC);
export { TranslatedFeeTargets as FeeTargets };
