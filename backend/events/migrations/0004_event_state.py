from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0003_event_ticketmaster_id_session_seat_cols_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='state',
            field=models.CharField(
                choices=[
                    ('AC', 'Acre'),
                    ('AL', 'Alagoas'),
                    ('AP', 'Amapá'),
                    ('AM', 'Amazonas'),
                    ('BA', 'Bahia'),
                    ('CE', 'Ceará'),
                    ('DF', 'Distrito Federal'),
                    ('ES', 'Espírito Santo'),
                    ('GO', 'Goiás'),
                    ('MA', 'Maranhão'),
                    ('MT', 'Mato Grosso'),
                    ('MS', 'Mato Grosso do Sul'),
                    ('MG', 'Minas Gerais'),
                    ('PA', 'Pará'),
                    ('PB', 'Paraíba'),
                    ('PR', 'Paraná'),
                    ('PE', 'Pernambuco'),
                    ('PI', 'Piauí'),
                    ('RJ', 'Rio de Janeiro'),
                    ('RN', 'Rio Grande do Norte'),
                    ('RS', 'Rio Grande do Sul'),
                    ('RO', 'Rondônia'),
                    ('RR', 'Roraima'),
                    ('SC', 'Santa Catarina'),
                    ('SP', 'São Paulo'),
                    ('SE', 'Sergipe'),
                    ('TO', 'Tocantins'),
                ],
                default='SP',
                max_length=2,
            ),
        ),
    ]
