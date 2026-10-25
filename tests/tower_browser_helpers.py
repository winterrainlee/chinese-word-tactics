"""Use real controls to solve current workbenches; never inject solved state."""
def action(page, name, value=None):
    selector=f'[data-academic-action="{name}"]'
    if value is not None: selector += f'[data-value="{value}"]'
    for key in ['edit-memo','edit-link']:
        panel=page.locator(f'details[data-mvp-detail="{key}"]')
        if panel.count() and panel.locator(selector).count() and panel.get_attribute('open') is None:
            panel.locator('summary').first.click()
    page.locator(selector).click()

def solve(page, check=None):
    for _ in range(80):
        if page.locator('#storyView').is_visible(): finish_story(page); continue
        config=page.evaluate('current().academicTower')
        state=page.evaluate('state.academicTower')
        if state['phase']=='complete': return
        if config.get('tasks'):
            if state['phase']=='notice':
                for word in config['noticeWords']:action(page,'select-character',word+':然')
                action(page,'submit-notice');continue
            if state['phase']=='discovery':action(page,'start-compare');continue
            task=config['tasks'][state['taskIndex']]
            if state['phase']=='review': action(page,'meaning-next'); continue
            if check: check(page,task,'initial')
            for slot in task['slots']:
                if not task.get('directSlot'): action(page,'meaning-slot',slot['id'])
                action(page,'meaning-source',task['answer'][slot['id']])
            if task.get('relations'): action(page,'meaning-relation',task['relation'])
            if check: check(page,task,'selected')
            action(page,'meaning-confirm')
            if check and task.get('type')!='read': check(page,task,'confirmed')
        elif config['kind']=='claim-revision':
            case=config['cases'][state['caseIndex']]
            if state['phase']=='claim': action(page,'select-claim',case['repairTargetId']);action(page,'submit-claim')
            elif state['phase']=='revision': action(page,'select-revision',case['correctRevisionId']);action(page,'submit-revision')
            else: action(page,'next-case')
        elif config['kind']=='replacement-link':
            case=config['cases'][state['caseIndex']]
            if state['phase']=='place-results':
                for slot,key in [('absent','absentResultId'),('actual','actualResultId')]:
                    action(page,'select-slot',slot);action(page,'select-result',case[key])
                action(page,'submit-results')
            elif state['phase']=='choose-link':action(page,'select-link',config['correctLinkId']);action(page,'submit-link')
            else:action(page,'next-case')
        elif config['kind']=='connector-cloze':
            if state['phase']=='review':action(page,'next-blank')
            else:action(page,'select-connector',config['blanks'][state['blankIndex']]['correctConnectorId']);action(page,'submit-connector')
        else: raise AssertionError(state)
    raise AssertionError('did not finish')

def finish_story(page):
    for _ in range(int(page.locator('#storyCount').inner_text().split('/')[1])):page.locator('#storyNext').click()
