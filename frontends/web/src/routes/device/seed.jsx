import { Component } from 'preact';
import { translate } from 'react-i18next';
import { apiPost } from '../../utils/request';
//import ManageBackups from '../../routes/device/manage-backups/manage-backups';
import { PasswordRepeatInput } from '../../components/password';
import { Button, Input } from '../../components/forms';
import { BitBox } from '../../components/icon/logo';
import style from '../../components/app.css';

const stateEnum = Object.freeze({
    DEFAULT: 'default',
    WAITING: 'waiting',
    ERROR: 'error'
});

@translate()
export default class Seed extends Component {
    state = {
        status: stateEnum.DEFAULT,
        walletName: '',
        backupPassword: '',
        error: ''
    }

    validate = () => {
        if (!this.walletNameInput || !this.walletNameInput.validity.valid) {
            return false;
        }
        return this.state.backupPassword && this.state.walletName !== '';
    }

    handleFormChange = event => {
        this.setState({ [event.target.id]: event.target.value });
    };

    handleSubmit = event => {
        event.preventDefault();
        if (!this.validate()) {
            return;
        }
        this.setState({
            status: stateEnum.WAITING,
            error: ''
        });
        apiPost('devices/' + this.props.deviceID + '/create-wallet', {
            walletName: this.state.walletName,
            backupPassword: this.state.backupPassword
        }).then(data => {
            if (!data.success) {
                this.displayError(data.errorMessage);
            }
            if (this.backupPasswordInput) {
                this.backupPasswordInput.clear();
            }
            this.setState({ backupPassword: '' });
        });
    };

    displayError = (errorMessage) => {
        this.setState({ status: stateEnum.ERROR, error: errorMessage });
    }

    setValidBackupPassword = backupPassword => {
        this.setState({ backupPassword });
    }

    render({ t, deviceID }, { status, walletName, error }) {

        if (status === stateEnum.WAITING) {
            return (
                <div className={style.container}>
                    {BitBox}
                    <div className={style.content}>{t('seed.creating')}</div>
                </div>
            );
        }

        return (
            <div className={style.container}>
                {BitBox}
                <div className={style.content}>
                    <form onsubmit={this.handleSubmit}>
                        { status === stateEnum.ERROR ? <p style="color: var(--color-error);">{error}</p> : null }
                        <div>
                            <Input
                                pattern="[^\s]+"
                                autoFocus
                                id="walletName"
                                label={t('seed.walletName.label')}
                                placeholder={t('seed.walletName.placeholder')}
                                disabled={status === stateEnum.WAITING}
                                onInput={this.handleFormChange}
                                getRef={ref => this.walletNameInput = ref}
                                value={walletName} />
                            <PasswordRepeatInput
                                label={t('seed.password.label')}
                                ref={ref => this.backupPasswordInput = ref}
                                disabled={status === stateEnum.WAITING}
                                onValidPassword={this.setValidBackupPassword} />
                        </div>
                        <p>{t('seed.description')}</p>
                        <div>
                            <Button
                                type="submit"
                                primary
                                disabled={!this.validate() || status === stateEnum.WAITING}>
                                {t('seed.create')}
                            </Button>
                        </div>
                    </form>
                    {/*
                    <p>-- OR --</p>
                    <ManageBackups showCreate={false} displayError={this.displayError} deviceID={deviceID} />
                    */}
                </div>
            </div>
        );
    }
}
