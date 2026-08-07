'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Avatar } from '../Avatar'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { DatePicker } from '../DatePicker'
import { Input } from '../Input'
import { RadioGroup } from '../Radio'
import { SearchInput } from '../SearchInput'
import { Select } from '../Select'
import { SelectMenu } from '../SelectMenu'
import { Switch } from '../Switch'
import { Textarea } from '../Textarea'
import { ShowcaseSection } from './ShowcaseSection'

export function BasicControlsShowcase() {
  const t = useTranslations('devUi')
  const [checkboxValue, setCheckboxValue] = useState(false)
  const [radioValue, setRadioValue] = useState('option1')
  const [switchValue, setSwitchValue] = useState(false)
  const [selectValue, setSelectValue] = useState('')
  const [selectMenuValue, setSelectMenuValue] = useState('')

  const options = [
    { label: t('options.a'), value: 'a' },
    { label: t('options.b'), value: 'b' },
    { label: t('options.c'), value: 'c' },
  ]
  const selectOptions = [{ label: t('options.empty'), value: '' }, ...options]

  return (
    <>
      <ShowcaseSection title={t('sections.button')}>
        <Button variant="primary">{t('button.primary')}</Button>
        <Button variant="secondary">{t('button.secondary')}</Button>
        <Button variant="ghost">{t('button.ghost')}</Button>
        <Button variant="outline">{t('button.outline')}</Button>
        <Button variant="danger">{t('button.danger')}</Button>
        <Button variant="primary" disabled>
          {t('button.disabled')}
        </Button>
        <Button variant="primary" isLoading>
          {t('button.loading')}
        </Button>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.badge')}>
        <Badge variant="default">{t('badge.default')}</Badge>
        <Badge variant="success">{t('badge.success')}</Badge>
        <Badge variant="warning">{t('badge.warning')}</Badge>
        <Badge variant="error">{t('badge.error')}</Badge>
        <Badge variant="info">{t('badge.info')}</Badge>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.avatar')}>
        <Avatar alt={t('avatar.admin')} size="sm" />
        <Avatar alt={t('avatar.john')} fallback="JD" size="md" />
        <Avatar alt={t('avatar.superAdmin')} fallback="SA" size="lg" />
        <Avatar alt={t('avatar.extraLarge')} fallback="XL" size="xl" />
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.input')}>
        <div className="grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
          <Input label={t('input.defaultLabel')} placeholder={t('input.defaultPlaceholder')} />
          <Input
            label={t('input.errorLabel')}
            placeholder={t('input.errorPlaceholder')}
            error={t('input.requiredError')}
          />
          <Input label={t('input.disabledLabel')} placeholder={t('input.disabledPlaceholder')} disabled />
          <Input
            label={t('input.passwordLabel')}
            type="password"
            placeholder={t('input.passwordPlaceholder')}
          />
          <Input
            label={t('input.readonlyLabel')}
            value={t('input.readonlyValue')}
            readOnly
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.textarea')}>
        <div className="grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
          <Textarea
            id="showcase-textarea-default"
            label={t('textarea.defaultLabel')}
            placeholder={t('textarea.placeholder')}
            hint={t('textarea.hint')}
            maxLength={120}
            showCount
          />
          <Textarea
            id="showcase-textarea-error"
            label={t('textarea.errorLabel')}
            defaultValue={t('textarea.error')}
            error={t('textarea.error')}
          />
          <Textarea
            id="showcase-textarea-disabled"
            label={t('textarea.disabledLabel')}
            placeholder={t('textarea.disabledPlaceholder')}
            disabled
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.select')}>
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
          <Select
            label={t('select.label')}
            value={selectValue}
            onChange={(event) => setSelectValue(event.target.value)}
            options={selectOptions}
          />
          <Select
            label={t('select.errorLabel')}
            error={t('select.error')}
            value={selectValue}
            onChange={(event) => setSelectValue(event.target.value)}
            options={selectOptions}
          />
          <Select label={t('select.disabledLabel')} disabled options={selectOptions} />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.selectMenu')}>
        <div className="w-64">
          <SelectMenu
            label={t('selectMenu.label')}
            placeholder={t('selectMenu.placeholder')}
            value={selectMenuValue}
            onValueChange={setSelectMenuValue}
            options={options}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.checkbox')}>
        <div className="flex flex-col gap-3">
          <Checkbox
            id="showcase-checkbox"
            label={t('checkbox.label')}
            checked={checkboxValue}
            onChange={(event) => setCheckboxValue(event.target.checked)}
            description={t('checkbox.description')}
          />
          <Checkbox id="showcase-checkbox-checked" label={t('checkbox.label')} checked readOnly />
          <Checkbox id="showcase-checkbox-disabled" label={t('checkbox.disabled')} disabled />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.radio')}>
        <RadioGroup
          name="showcase-radio"
          label={t('radio.label')}
          value={radioValue}
          on_change={setRadioValue}
          options={[
            { label: t('options.one'), value: 'option1' },
            { label: t('options.two'), value: 'option2' },
            { label: t('radio.disabled'), value: 'option3', is_disabled: true },
          ]}
        />
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.switch')}>
        <div className="flex flex-col gap-3">
          <Switch
            id="showcase-switch"
            label={t('switch.label')}
            checked={switchValue}
            onCheckedChange={setSwitchValue}
          />
          <Switch id="showcase-switch-checked" label={t('switch.label')} checked readOnly />
          <Switch id="showcase-switch-disabled" label={t('switch.disabled')} disabled />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.datePicker')}>
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
          <DatePicker label={t('datePicker.label')} helperText={t('datePicker.helper')} />
          <DatePicker
            label={t('datePicker.label')}
            error={t('datePicker.error')}
            variant="error"
          />
          <DatePicker
            label={t('datePicker.disabledLabel')}
            helperText={t('datePicker.disabledHelper')}
            disabled
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection title={t('sections.searchInput')}>
        <div className="w-full max-w-sm">
          <SearchInput placeholder={t('searchInput.placeholder')} onChange={() => undefined} />
        </div>
      </ShowcaseSection>
    </>
  )
}
